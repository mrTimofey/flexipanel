<template lang="pug">
.form-field-image(:class="{ multiple }" :style=`// @ts-ignore
							'--frame-width:' + (frameWidth || 'auto') + ';--frame-height:' + (frameHeight || 'auto')`)
	.form-field-image-label
		slot(name="label")
	.progress.active(v-if="uploadStatus === UploadStatus.InQueue")
		.progress-bar.progress-bar-striped(style="width:100%;opacity:0.5")
	.progress.active(v-else-if="uploadStatus === UploadStatus.InProgress")
		.progress-bar.progress-bar-striped.progress-bar-animated(
			:style="{ width: `${uploadProgress * 100}%` }"
		)
	.form-field-image-actions(v-else)
		label.btn(
			v-if="multiple || !modelValueItems.length"
			:disabled="disabled"
			:class="errors ? 'btn-outline-danger' : 'btn-light'"
		)
			input(
				type="file"
				style="display:none"
				@change="onFileChange($event)"
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
		@change="$event.moved && changePosition($event.moved.oldIndex, $event.moved.newIndex)"
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
					.btn.btn-danger.btn-sm.position-absolute.top-0.start-0.m-2(@click="removeItem(index)" :disabled="disabled")
						i.fas.fa-trash
				.btn-group(v-else)
					.btn.btn-danger(@click="removeItem(index)" :disabled="disabled")
						i.fas.fa-trash
					.btn(:class="errors ? 'btn-outline-danger' : 'btn-light'") {{ uploadMessage || trans('uploadMessage') }}
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import DraggableGroup from 'vuedraggable';
import makeUploadComponent from './file-upload';

export default makeUploadComponent({
	components: { DraggableGroup },
	props: {
		frameWidth: {
			type: String,
			default: '',
		},
		frameHeight: {
			type: String,
			default: '',
		},
	},
});
</script>

<style lang="stylus" scoped>
.img-thumbnail
	min-width 5rem
	min-height 5rem
.form-field-image-item
	img
		width var(--frame-width)
		height var(--frame-height)
.multiple
	.form-field-image-item a
		cursor move
</style>
