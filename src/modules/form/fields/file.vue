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
		label.btn(
			v-else
			:disabled="disabled"
			:class="errors ? 'btn-outline-danger' : 'btn-light'"
		)
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
		a.btn(
			v-if="modelValue && typeof modelValue === 'string'"
			target="_blank"
			:class="errors ? 'btn-outline-danger' : 'btn-light'"
			:href="fileUrl"
		)
			i.fa-solid.fa-download
			!=' '
			| {{ valueLabel || modelValue }}
		.btn(
			v-else-if="modelValue"
			:class="errors ? 'btn-outline-danger' : 'btn-light'"
		) {{ uploadMessage || trans('uploadMessage') }}
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import Component from './file-upload';

export default Component;
</script>
