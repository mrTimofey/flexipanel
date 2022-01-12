import { computed, ref, defineComponent } from 'vue';
import type { PropType, ComponentPropsOptions, Component } from 'vue';
import HttpClient from '../../http';
import NotificationManager from '../../notification';
import { get, useTemplate, useTranslator } from '../../vue-composition-utils';

export enum UploadStatus {
	Idle = 1,
	InQueue = 2,
	InProgress = 3,
}

export default function makeUploadComponent(options: { props?: ComponentPropsOptions; components?: Record<string, Component> } = {}) {
	return defineComponent({
		components: options.components || {},
		props: {
			modelValue: {
				type: [String, Array] as PropType<string | string[] | null>,
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
			multiple: {
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
			errors: {
				type: Array as PropType<string[]>,
				default: null,
			},
			...options.props,
		},
		emits: ['update:modelValue'],
		setup(props, { emit }) {
			const { tpl } = useTemplate();
			const http = get(HttpClient);
			const notifier = get(NotificationManager);
			const uploadStatus = ref(UploadStatus.Idle);
			const uploadProgress = ref(0);
			const modelValueArray = computed<(string | Blob)[]>(() => {
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
					url: typeof value === 'string' ? tpl(props.urlTemplate, value) : '',
				})),
			);

			const uploadFile = async (file: File) => {
				uploadStatus.value = UploadStatus.InQueue;
				try {
					const res = await http.upload(props.uploadEndpoint, file, {
						onProgress({ loaded, total }) {
							uploadStatus.value = UploadStatus.InProgress;
							uploadProgress.value = loaded / total;
						},
					});
					emit('update:modelValue', props.multiple ? [...modelValueArray.value, res.body] : res.body);
				} catch (err) {
					notifier.push({
						type: 'error',
						body: `${err}`,
					});
				} finally {
					uploadStatus.value = UploadStatus.Idle;
					uploadProgress.value = 0;
				}
			};

			return {
				...useTranslator(),
				UploadStatus,
				uploadStatus,
				uploadProgress,
				modelValueItems,
				uploadFile,
				async onFileChange(e: Event) {
					if (props.disabled) {
						return;
					}
					const target = e.target as HTMLInputElement;
					if (!target.files?.length) {
						return;
					}
					await Array.from(target.files)
						.map((file) => () => uploadFile(file))
						.reduce((prev, fn) => prev.then(fn), Promise.resolve());
					target.value = '';
				},
				clearValue() {
					if (props.disabled) {
						return;
					}
					emit('update:modelValue', props.multiple ? [] : null);
				},
				removeItem(index: number) {
					const newValue = modelValueArray.value.slice();
					newValue.splice(index, 1);
					emit('update:modelValue', props.multiple ? newValue : newValue[0] || null);
				},
				changePosition(from: number, to: number) {
					const item = modelValueArray.value[from];
					const newValue = [...modelValueArray.value];
					newValue.splice(from, 1);
					newValue.splice(to, 0, item);
					emit('update:modelValue', newValue);
				},
			};
		},
	});
}
