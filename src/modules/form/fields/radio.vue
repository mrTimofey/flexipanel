<template lang="pug">
.form-field-select
	slot(name="label")
	label.form-check(v-for="option in normalizedOptions")
		input.form-check-input(
			type="radio"
			:disabled="disabled"
			:checked="option.value === modelValue"
			@change="selectOption(option)"
		)
		!=' '
		span.form-check-label {{ option.label }}
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed } from '@vue/runtime-core';
import type { IOption, OptionsProp } from './select-utils';
import { normalizeOptions } from './select-utils';

export default defineComponent({
	props: {
		modelValue: {
			type: [String, Number, Boolean, Object],
			default: null,
		},
		options: {
			type: [Array, Object] as PropType<OptionsProp>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		valueKey: {
			type: String,
			default: 'value',
		},
		labelKey: {
			type: String,
			default: 'label',
		},
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const normalizedOptions = computed(() => normalizeOptions(props));
		return {
			normalizedOptions,
			selectOption(option: IOption) {
				emit('update:modelValue', option.value);
			},
		};
	},
});
</script>
