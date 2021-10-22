<template lang="pug">
.select-field
	select.form-select.form-select-sm(
		:disabled="disabled"
		:value="modelValue"
		@change="onChange($event)"
	)
		option(v-for="item in normalizedOptions") {{ item.label }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed } from '@vue/runtime-core';

interface IOption {
	value: unknown;
	label: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object';
}

type InputOption = string | number | boolean | Record<string, unknown>;
export type OptionsProp = InputOption[] | Record<string, InputOption>;

export default defineComponent({
	props: {
		modelValue: {
			type: [String, Number, Boolean, Object],
			required: true,
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
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const normalizedOptions = computed<IOption[]>(() => {
			if (Array.isArray(props.options)) {
				return props.options
					.map<IOption | null>((item) => {
						if (['string', 'boolean', 'number'].includes(typeof item)) {
							return {
								value: item,
								label: `${item}`,
							};
						}
						if (isObject(item) && item[props.valueKey] !== undefined) {
							return {
								value: item[props.valueKey],
								label: `${item[props.labelKey]}`,
							};
						}
						return null;
					})
					.filter<IOption>((item): item is IOption => item !== null);
			}
			if (isObject(props.options)) {
				return Object.entries(props.options).map(([value, label]) => ({
					value,
					label: `${isObject(label) ? label[props.labelKey] : label}`,
				}));
			}
			return [];
		});
		return {
			normalizedOptions,
			onChange(e: Event) {
				const { selectedIndex } = e.target as HTMLSelectElement;
				emit('update:modelValue', normalizedOptions.value[selectedIndex].value);
			},
		};
	},
});
</script>
