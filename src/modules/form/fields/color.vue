<template lang="pug">
.form-field-color.d-flex.align-items-center
	field-checkbox.me-2(
		v-if="!required"
		v-model="hasValue"
		:disabled="disabled"
	)
		template(#label) {{ hasValue ? (trans('color') + ':') : trans('noColor') }}
	input.form-control.form-control-color.p-0.border-0(
		v-if="hasValue || required"
		type="color"
		:value="colorValue"
		:disabled="disabled"
		:list="listId"
		@input="emitValue"
	)
	datalist(v-if="listId" :id="listId")
		option(v-for="color in options") {{ color }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { useTranslator } from '../../vue-composition-utils';
import FieldCheckbox from './boolean.vue';

let guidCounter = 0;
function guid() {
	guidCounter += 1;
	return `form-field-color-${guidCounter}`;
}

export default defineComponent({
	components: { FieldCheckbox },
	props: {
		placeholder: {
			type: String,
			default: '',
		},
		modelValue: {
			type: String,
			default: '',
		},
		required: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		options: {
			type: Array as PropType<string[]>,
			default: null,
		},
		listId: {
			type: String,
			default: () => guid(),
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			...useTranslator(),
			hasValue: computed<boolean>({
				get() {
					return !!props.modelValue;
				},
				set(v) {
					emit('update:modelValue', v ? '000000' : '');
				},
			}),
			colorValue: computed(() => (props.modelValue ? `#${props.modelValue}` : '')),
			emitValue(e: Event) {
				const input = e.target as HTMLInputElement;
				if (input.value) {
					const val = input.value.substring(1).toUpperCase();
					if (val !== props.modelValue) {
						emit('update:modelValue', val);
					}
				} else if (props.modelValue) {
					emit('update:modelValue', '');
				}
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.form-field-color
	height 31px
	input
		font-size 18px
		line-height 1
</style>
