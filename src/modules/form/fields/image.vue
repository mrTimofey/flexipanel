<template lang="pug">
.form-field-image(:class="{ multiple }" :style="frameSizeStyle")
	modal-dialog.p-0(
		v-if="pendingCropFiles.length"
		@close="endCropping()"
		@action-click="onCropActionClick($event.index === 0)"
		:size="cropModalSize"
		:title="`${trans('editImage')} (${cropFileCount - pendingCropFiles.length + 1}/${cropFileCount})`"
		:actions="cropModalActions"
	)
		.form-field-image-cropper-source
			img(ref="cropperEl")
	.form-field-image-label
		slot(name="label")
	.progress.active(v-if="uploadStatus === UploadStatus.InQueue")
		.progress-bar.progress-bar-striped(style="width:100%;opacity:0.5")
	.progress.active(v-else-if="uploadStatus === UploadStatus.InProgress")
		.progress-bar.progress-bar-striped.progress-bar-animated(:style="{ width: `${uploadProgress * 100}%` }")
	.form-field-image-actions.my-1(v-else)
		label.btn.form-field-upload-input(
			v-if="multiple || !modelValueItems.length"
			:class="errors ? 'btn-outline-danger' : 'btn-light'"
		)
			input(
				type="file"
				@change="onFileInputChange($event)"
				:accept="accept"
				:disabled="disabled"
				:multiple="multiple"
			)
			i.fas.fa-upload
			!=' '
			| {{ placeholder || trans(multiple ? 'chooseImages' : 'chooseImage') }}
	draggable-group.d-flex.flex-wrap(
		:item-key="(item: unknown) => `${item}`"
		:animation="200"
		:model-value="modelValueItems"
		:disabled="!multiple"
		@change="onDragAndDrop($event)"
	)
		template(#item="{ element, index }")
			.form-field-image-item.me-2.my-1
				.d-block.position-relative(v-if="typeof element.value === 'string'")
					a(target="_blank" :href="element.url")
						img.img-thumbnail(
							:src="element.url"
							:alt="element.value"
							:class="errors ? ['border-danger', 'bg-danger'] : null"
							style="--bs-bg-opacity:0.25"
						)
					button.btn.btn-danger.btn-sm.btn-delete.m-2(@click="removeItem(index)" :disabled="disabled")
						i.fas.fa-trash
				.btn-group(v-else)
					button.btn.btn-danger(@click="removeItem(index)" :disabled="disabled")
						i.fas.fa-trash
					.btn(:class="errors ? 'btn-outline-danger' : 'btn-light'") {{ uploadMessage || trans('uploadMessage') }}
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, ref } from 'vue';
import type CropperClass from 'cropperjs';
import DraggableGroup from '../../drag-and-drop';
import useFieldWithFileUploads, { getFileFieldProps } from './file-upload';
import ModalDialog from '../../modal/modal.vue';
import type { ModalSize, IModalAction } from '../../modal';
import { useTranslator } from '../../vue-composition-utils';

import 'cropperjs/dist/cropper.css';

export type CropOptions = CropperClass.Options & {
	minCroppedWidth?: number;
	maxCroppedWidth?: number;
	minCroppedHeight?: number;
	maxCroppedHeight?: number;
};

export const defaultCropperOptions: CropOptions = {
	viewMode: 2,
};

export default defineComponent({
	components: { DraggableGroup, ModalDialog },
	props: {
		...getFileFieldProps({ defaultAccept: 'image/*' }),
		frameWidth: {
			type: String,
			default: '',
		},
		frameHeight: {
			type: String,
			default: '',
		},
		// TODO move cropping to separate composable or component
		crop: {
			type: [Boolean, Object] as PropType<boolean | CropOptions>,
			default: false,
		},
		cropModalSize: {
			type: String as PropType<ModalSize>,
			default: 'lg',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { trans } = useTranslator();
		let cropper: CropperClass | null = null;
		const cropperEl = ref<HTMLImageElement | null>(null);
		const fieldWithFileUploads = useFieldWithFileUploads(props, (newValue) => emit('update:modelValue', newValue));
		const pendingCropFiles = ref<File[]>([]);
		const cropFileCount = ref(0);
		const endCropping = () => {
			pendingCropFiles.value = [];
			cropFileCount.value = 0;
			if (cropper) {
				cropper.destroy();
				cropper = null;
			}
		};
		const limitCropFrame = (event: CropperClass.CropEvent) => {
			if (typeof props.crop === 'boolean' || !cropper) {
				return;
			}
			const { minCroppedWidth = 0, maxCroppedWidth = Infinity, minCroppedHeight = 0, maxCroppedHeight = Infinity } = props.crop;
			if (!minCroppedWidth && maxCroppedWidth === Infinity && !minCroppedHeight && maxCroppedHeight === Infinity) {
				return;
			}
			const width = event.detail.width;
			const height = event.detail.height;

			if (width < minCroppedWidth || height < minCroppedHeight || width > maxCroppedWidth || height > maxCroppedHeight) {
				cropper.setData({
					width: Math.max(minCroppedWidth, Math.min(maxCroppedWidth, width)),
					height: Math.max(minCroppedHeight, Math.min(maxCroppedHeight, height)),
				});
			}
		};
		const resetCropper = async () => {
			if (cropper) {
				cropper.destroy();
				cropper = null;
			}
			if (!cropperEl.value) {
				return;
			}
			const Cropper = await import('cropperjs').then((m) => m.default);
			const options = typeof props.crop === 'boolean' ? { ...defaultCropperOptions } : props.crop;
			// limit the cropping frame to fit min/max dimensions in pixels if there are any
			options.crop = limitCropFrame;
			cropper = new Cropper(cropperEl.value, options);
		};
		const injectNextCropImage = () => {
			const reader = new FileReader();
			reader.readAsDataURL(pendingCropFiles.value[0]);
			reader.onloadend = (loadedEvent) => {
				if (!loadedEvent.target?.result) {
					return;
				}
				const image = cropperEl.value;
				if (!image) {
					return;
				}
				image.src = loadedEvent.target.result as string;
				resetCropper();
			};
		};

		return {
			...fieldWithFileUploads,
			cropperEl,
			pendingCropFiles,
			cropFileCount,
			trans,
			endCropping,
			frameSizeStyle: computed(() => `--frame-width:${props.frameWidth || 'auto'};--frame-height:${props.frameHeight || 'auto'}`),
			cropModalActions: computed<IModalAction[]>(() => [
				{
					type: 'primary',
					title: trans('apply'),
				},
				{
					type: 'secondary',
					title: trans('cancel'),
				},
			]),
			onCropActionClick(apply: boolean) {
				if (apply && cropper) {
					const mime = pendingCropFiles.value[0].type || 'image/jpeg';
					cropper
						.getCroppedCanvas({
							imageSmoothingEnabled: false,
						})
						.toBlob((blob) => {
							if (!blob) {
								return;
							}
							fieldWithFileUploads.uploadFile(blob);
							pendingCropFiles.value = pendingCropFiles.value.slice(1);
							if (pendingCropFiles.value.length > 0) {
								injectNextCropImage();
							} else {
								endCropping();
							}
						}, mime);
				} else {
					endCropping();
				}
			},
			onFileInputChange(e: Event) {
				if (!props.crop) {
					fieldWithFileUploads.onFileInputChange(e);
					return;
				}
				const target = e.target as HTMLInputElement;
				if (target.disabled || !target.files?.length) {
					return;
				}
				const croppableImages: File[] = [];
				Array.from(target.files).forEach((file) => {
					// don't crop gif and svg images, just upload them as-is
					if (['image/gif', 'image/svg', 'image/svg+xml'].includes(file.type)) {
						fieldWithFileUploads.uploadFile(file);
					} else {
						croppableImages.push(file);
					}
				});
				if (!croppableImages.length) {
					return;
				}
				pendingCropFiles.value = croppableImages;
				cropFileCount.value = pendingCropFiles.value.length;
				target.value = '';
				injectNextCropImage();
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.img-thumbnail
	min-width 3rem
	min-height 3rem
.form-field-image-item
	img
		width var(--frame-width)
		height var(--frame-height)
.form-field-image-cropper-source
	img
		display block
		width 100%
.form-field-upload-input
	position relative
	input
		position absolute
		top 0
		right 0
		bottom 0
		left 0
		opacity 0
		cursor pointer
.multiple
	.form-field-image-item a
		cursor move
.btn-delete
	position absolute
	top 0
	left 0
	padding 0 0.2rem
	font-size 12px
</style>
