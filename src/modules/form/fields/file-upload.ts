import { computed, ref } from 'vue';
import type { PropType, ExtractPropTypes } from 'vue';
import HttpClient, { HttpRequestError } from '../../http';
import NotificationManager from '../../notification';
import { useDragAndDrop } from '../../drag-and-drop';
import { get, useTemplate, useTranslator } from '../../vue-composition-utils';
import { getCommonProps } from './common';
import Translator from '../../i18n';

export enum UploadStatus {
	Idle = 1,
	InQueue = 2,
	InProgress = 3,
}

/**
 * File upload form field common props.
 */
export function getFileFieldProps(options: { defaultAccept?: string } = {}) {
	return {
		...getCommonProps({
			type: [String, Array] as PropType<string | string[] | null>,
			default: null,
		}),
		multiple: {
			type: Boolean,
			default: false,
		},
		accept: {
			type: String,
			default: options.defaultAccept || '',
		},
		uploadMessage: {
			type: String,
			default: '',
		},
		valueLabel: {
			type: String,
			default: '',
		},
		uploadEndpoint: {
			type: String,
			default: '/api/files',
		},
		urlTemplate: {
			type: String,
			default: '',
		},
	};
}

/**
 * File input upload logic, supports multiple uploads.
 * @param config HTTP uploads endpoint, onUpload is called on each file upload with HTTP response
 */
export function useFileInput<T = unknown>(config: Readonly<{ endpoint: string; onUpload: (response: T) => void }>) {
	const notifier = get(NotificationManager);
	const http = get(HttpClient);
	const trans = get(Translator);
	const uploadStatus = ref(UploadStatus.Idle);
	const uploadProgress = ref(0);

	const uploadFile = async (file: Blob) => {
		uploadStatus.value = UploadStatus.InQueue;
		try {
			const res = await http.upload<T>(config.endpoint, file, {
				onProgress({ loaded, total }) {
					uploadStatus.value = UploadStatus.InProgress;
					uploadProgress.value = loaded / total;
				},
			});
			config.onUpload(res.body);
		} catch (err) {
			const body = err instanceof HttpRequestError && err.res?.status === 413 ? trans.get('fileIsTooLarge') : `${err}`;
			notifier.push({ type: 'error', body });
		} finally {
			uploadStatus.value = UploadStatus.Idle;
			uploadProgress.value = 0;
		}
	};

	return {
		UploadStatus,
		uploadStatus,
		uploadProgress,
		uploadFile,
		async onFileInputChange(e: Event) {
			const target = e.target as HTMLInputElement;
			if (target.disabled || !target.files?.length) {
				return;
			}
			await Array.from(target.files)
				.map((file) => () => uploadFile(file))
				.reduce((prev, fn) => prev.then(fn), Promise.resolve());
			target.value = '';
		},
	};
}

/**
 * Common setup for built-in file based fields.
 * @param props file field props, @see getFileFieldProps
 * @param onModelValueUpdate emit value here
 * @returns
 */
export default function useFieldWithFileUploads(props: ExtractPropTypes<ReturnType<typeof getFileFieldProps>>, onModelValueUpdate: (files: string | string[] | null) => void) {
	const { tpl } = useTemplate();
	const modelValueArray = computed<string[]>(() => {
		if (Array.isArray(props.modelValue)) {
			return props.modelValue;
		}
		if (props.modelValue) {
			return [props.modelValue];
		}
		return [];
	});
	const modelValueItems = computed(() =>
		modelValueArray.value.map((value) => ({
			value,
			url: props.urlTemplate ? tpl(props.urlTemplate, value) : value,
		})),
	);

	return {
		...useTranslator(),
		...useDragAndDrop((newValue) => onModelValueUpdate(newValue), modelValueArray),
		...useFileInput<string>({
			get endpoint() {
				return props.uploadEndpoint;
			},
			onUpload(file) {
				onModelValueUpdate(props.multiple ? [...modelValueArray.value, file] : file);
			},
		}),
		modelValueItems,
		clearValue() {
			if (props.disabled) {
				return;
			}
			onModelValueUpdate(props.multiple ? [] : null);
		},
		removeItem(index: number) {
			const newValue = modelValueArray.value.slice();
			newValue.splice(index, 1);
			onModelValueUpdate(props.multiple ? newValue : newValue[0] || null);
		},
	};
}
