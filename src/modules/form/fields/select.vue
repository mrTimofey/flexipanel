<template lang="pug">
.form-field-select
	slot(name="label")
	select.form-select.form-select-sm(
		:disabled="disabled"
		:class="{ 'is-invalid': !!errors }"
		@change="onChange($event)"
	)
		option(v-if="!required" :selected="modelValue === emptyValue") {{ placeholder }}
		option(v-for="item in normalizedOptions" :selected="modelValue === item.value") {{ item.label }}
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed } from 'vue';
import type { OptionsProp } from './select-utils';
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
		required: {
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
		emptyValue: {
			type: [String, Number, Boolean, Object],
			default: null,
		},
		placeholder: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const normalizedOptions = computed(() => normalizeOptions(props));
		return {
			normalizedOptions,
			onChange(e: Event) {
				const { selectedIndex } = e.target as HTMLSelectElement;
				// 0 is reserved for empty value so normalize the index if there is no empty value at all
				const normalizedIndex = props.required ? selectedIndex + 1 : selectedIndex;
				emit('update:modelValue', normalizedIndex === 0 ? props.emptyValue : normalizedOptions.value[normalizedIndex - 1].value);
			},
		};
	},
});
</script>
