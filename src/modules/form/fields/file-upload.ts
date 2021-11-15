import { computed, ref } from '@vue/reactivity';
import type { SetupContext } from '@vue/runtime-core';
import { defineComponent } from '@vue/runtime-core';
import HttpClient from '../../http';
import NotificationManager from '../../notification';
import { get, useTemplate, useTranslator } from '../../vue-composition-utils';

export enum UploadStatus {
	Idle = 1,
	InQueue = 2,
	InProgress = 3,
}

function useFileUpload<T extends ['update:modelValue'] = ['update:modelValue']>(
	props: {
		modelValue: string | Blob;
		urlTemplate: string;
		disabled: boolean;
		uploadEndpoint: string;
	},
	emit: SetupContext<T>['emit'],
) {
	const { tpl } = useTemplate();
	const http = get(HttpClient);
	const notifier = get(NotificationManager);
	const uploaded = computed<boolean>(() => typeof props.modelValue === 'string' && props.modelValue !== '');
	const uploadStatus = ref(UploadStatus.Idle);
	const uploadProgress = ref(0);

	return {
		...useTranslator(),
		UploadStatus,
		uploadStatus,
		uploadProgress,
		uploaded,
		fileUrl: computed(() => tpl(props.urlTemplate, props.modelValue)),
		async onFileChange(e: Event) {
			uploadProgress.value = 0;
			uploadStatus.value = UploadStatus.Idle;
			if (props.disabled) {
				return;
			}
			const target = e.target as HTMLInputElement;
			if (!target.files?.length) {
				return;
			}
			uploadStatus.value = UploadStatus.InQueue;
			try {
				const res = await http.upload(props.uploadEndpoint, target.files[0], {
					onProgress({ loaded, total }) {
						uploadStatus.value = UploadStatus.InProgress;
						uploadProgress.value = loaded / total;
					},
				});
				emit('update:modelValue', res.body);
			} catch (err) {
				notifier.push({
					type: 'error',
					body: `${err}`,
				});
			} finally {
				uploadStatus.value = UploadStatus.Idle;
			}
		},
		clearValue() {
			if (props.disabled) {
				return;
			}
			emit('update:modelValue', null);
		},
	};
}

export default defineComponent({
	props: {
		modelValue: {
			type: [String, Blob],
			default: null,
		},
		placeholder: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		accept: {
			type: String,
			default: '',
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
			default: '/storage/uploads/{{=it}}',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return useFileUpload(props, emit);
	},
});
