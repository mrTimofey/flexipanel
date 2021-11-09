<template lang="pug">
.form-field-file
	.form-field-file-label
		slot(name="label")
	.progress.active(v-if="uploadStatus === UploadStatus.InQueue")
		.progress-bar.progress-bar-striped(style="width:100%;opacity:0.5")
	.progress.active(v-else-if="uploadStatus === UploadStatus.InProgress")
		.progress-bar.progress-bar-striped.progress-bar-animated(
			:style="{ width: `${uploadProgress * 100}%` }"
		)
	.form-field-file-actions.btn-group(v-else)
		.btn.btn-danger(v-if="modelValue" @click="clearValue()" :disabled="disabled")
			i.fa-solid.fa-trash
		label.btn.btn-light(v-else :disabled="disabled")
			input(
				type="file"
				style="display:none"
				@change="onFileChange($event)"
				:accept="accept"
				:disabled="disabled"
			)
			i.fa-solid.fa-upload
			!=' '
			| {{ placeholder || trans('chooseFile') }}
		a.btn.btn-default(
			v-if="modelValue && typeof modelValue === 'string'"
			target="_blank"
			:href="modelValue"
		)
			i.fa-solid.fa-download
			!=' '
			| {{ valueLabel || modelValue }}
		.btn.btn-light(v-else-if="modelValue") {{ uploadMessage || trans('uploadMessage') }}
</template>
<script lang="ts">
import { defineComponent, ref, computed } from '@vue/runtime-core';
import HttpClient from '../../http';
import { get, useTranslator } from '../../vue-composition-utils';

enum UploadStatus {
	Idle = 1,
	InQueue = 2,
	InProgress = 3,
}

export default defineComponent({
	props: {
		placeholder: {
			type: String,
			default: '',
		},
		modelValue: {
			type: [String, File],
			default: null,
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
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const http = get(HttpClient);
		const uploaded = computed<boolean>(() => typeof props.modelValue === 'string' && props.modelValue !== '');
		const uploadStatus = ref(UploadStatus.Idle);
		const uploadProgress = ref(0);

		return {
			...useTranslator(),
			UploadStatus,
			uploadStatus,
			uploadProgress,
			uploaded,
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
					// TODO handle error
					console.error(err);
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
	},
});
</script>
