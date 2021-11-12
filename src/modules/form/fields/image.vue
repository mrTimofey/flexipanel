<template lang="pug">
.form-field-image
	.form-field-image-label
		slot(name="label")
	.progress.active(v-if="uploadStatus === UploadStatus.InQueue")
		.progress-bar.progress-bar-striped(style="width:100%;opacity:0.5")
	.progress.active(v-else-if="uploadStatus === UploadStatus.InProgress")
		.progress-bar.progress-bar-striped.progress-bar-animated(
			:style="{ width: `${uploadProgress * 100}%` }"
		)
	.form-field-image-actions(v-else)
		template(v-if="modelValue")
			.d-block.position-relative(v-if="typeof modelValue === 'string'")
				a(target="_blank" :href="fileUrl")
					img.img-thumbnail(:src="fileUrl" :alt="valueLabel || modelValue")
				.btn.btn-danger.btn-sm.position-absolute.top-0.start-0.m-2(@click="clearValue()" :disabled="disabled")
					i.fa-solid.fa-trash
			.btn-group(v-else)
				.btn.btn-danger(@click="clearValue()" :disabled="disabled")
					i.fa-solid.fa-trash
				.btn.btn-light {{ uploadMessage || trans('uploadMessage') }}
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
</template>

<script lang="ts">
import Component from './file-upload';

export default Component;
</script>

<style lang="stylus" scoped>
.img-thumbnail
	min-width 5rem
	min-height 5rem
</style>
