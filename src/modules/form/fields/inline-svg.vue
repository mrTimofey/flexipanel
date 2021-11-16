<template lang="pug">
.form-field-inline-svg
	modal-dialog(
		v-if="editCodeModalOpen"
		@close="editCodeModalOpen = false"
		@action-click="onEditCodeActionClick($event.index === 0)"
		size="lg"
		:title="trans('svgCode')"
		:actions="editCodeActions"
	)
		field-textarea(v-model="rawCode" :height="15")
	.form-field-inline-svg-label
		slot(name="label")
	.btn-group.btn-group-sm.my-1
		label.btn.btn-outline-primary(:disabled="disabled")
			input(
				type="file"
				style="display:none"
				accept=".svg"
				@change="onFileChange($event)"
				:disabled="disabled"
			)
			i.fa-solid.fa-file
			!=' '
			span.ps-1 {{ trans('svgFile') }}
		button.btn.btn-outline-primary(
			type="button"
			@click.prevent="openEditCodeModal()"
		)
			i.fa-solid.fa-pencil
			!=' '
			span.ps-1 {{ trans('svgCode') }}
		button.btn.btn-danger(
			v-if="modelValue"
			type="button"
			@click.prevent="clearValue()"
		)
			i.fa-solid.fa-trash
	.form-field-inline-svg-contents.d-flex(v-if="modelValue")
		.p-1.border.rounded(v-html="modelValue")
</template>

<script lang="ts">
import { defineComponent, ref, computed } from '@vue/runtime-core';
import { useTranslator } from '../../vue-composition-utils';
import type { IModalAction } from '../../modal/modal.vue';
import ModalDialog from '../../modal/modal.vue';
import FieldTextarea from './textarea.vue';

export default defineComponent({
	components: { ModalDialog, FieldTextarea },
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { trans } = useTranslator();
		const editCodeModalOpen = ref(false);
		const rawCode = ref('');

		return {
			trans,
			editCodeModalOpen,
			rawCode,
			editCodeActions: computed<IModalAction[]>(() => [
				{
					type: 'danger',
					title: trans('save'),
				},
				{
					type: 'secondary',
					title: trans('cancel'),
				},
			]),
			async onFileChange(e: Event) {
				const target = e.target as HTMLInputElement;
				if (!target.files?.length) {
					return;
				}
				const svgFile = target.files[0];
				if (svgFile.type !== 'image/svg+xml') {
					// TODO notification error
					return;
				}
				const svgContents = `<svg${(await svgFile.text()).split('<svg')[1]}`;
				emit('update:modelValue', svgContents);
			},
			openEditCodeModal() {
				rawCode.value = props.modelValue;
				editCodeModalOpen.value = true;
			},
			onEditCodeActionClick(save: boolean) {
				if (save) {
					emit('update:modelValue', rawCode.value);
				}
				editCodeModalOpen.value = false;
			},
			clearValue() {
				emit('update:modelValue', '');
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.form-field-inline-svg
	::v-deep(svg)
		display block
		max-width 100%
		height auto
.form-field-inline-svg-contents
	max-width 100%
</style>
