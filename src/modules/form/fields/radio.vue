<template lang="pug">
.form-field-select
	slot(name="label")
	template(v-if="theme === 'input-list'")
		label.form-check(v-for="option in normalizedOptions" @click.prevent="selectOption(option)")
			input.form-check-input(
				type="radio"
				:disabled="disabled"
				:checked="option.value === modelValue"
			)
			!=' '
			span.form-check-label {{ option.label }}
	template(v-else-if="theme === 'toggle'")
		.btn-group.btn-group-sm
			.btn.btn-outline-primary(
				v-for="option in normalizedOptions"
				:class="{ active: option.value === modelValue }"
				@click.prevent="selectOption(option)"
			) {{ option.label }}
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed } from 'vue';
import type { IOption, OptionsProp } from './select-utils';
import { normalizeOptions } from './select-utils';
import { getCommonProps } from './common';

export default defineComponent({
	props: {
		...getCommonProps({
			type: [String, Number, Boolean, Object],
			default: null,
		}),
		options: {
			type: [Array, Object] as PropType<OptionsProp>,
			required: true,
		},
		valueKey: {
			type: String,
			default: 'value',
		},
		labelKey: {
			type: String,
			default: 'label',
		},
		theme: {
			type: String,
			default: 'input-list',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const normalizedOptions = computed(() => normalizeOptions(props));
		return {
			normalizedOptions,
			selectOption(option: IOption) {
				if (props.modelValue === option.value) {
					return;
				}
				emit('update:modelValue', option.value);
			},
		};
	},
});
</script>
