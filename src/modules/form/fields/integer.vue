<template lang="pug">
.form-field-integer
	slot(name="label")
	input.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		@input="onInput($event)"
		@blur="onBlur()"
	)
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/runtime-core';

export default defineComponent({
	props: {
		modelValue: {
			type: [Number, String],
			default: 0,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		min: {
			type: Number,
			default: -Infinity,
		},
		max: {
			type: Number,
			default: Infinity,
		},
		default: {
			type: Number,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const defaultValue = computed(() => {
			if (props.default !== null) {
				return props.default;
			}
			if (props.min !== -Infinity) {
				return props.min;
			}
			return 0;
		});

		return {
			onInput(e: Event) {
				const target = e.target as HTMLInputElement;
				const real = target.value;
				const v = real.replace(/(?!^-)[^0-9]/g, '');
				if (v !== real) {
					target.value = v;
				}
				if (v !== '-') {
					const newValue = v === '' ? defaultValue.value : Number(v);
					if (props.modelValue !== newValue) {
						emit('update:modelValue', newValue);
					}
				}
			},
			onBlur() {
				if (Number.isNaN(props.modelValue)) {
					return;
				}
				if (props.modelValue < props.min) {
					emit('update:modelValue', props.min);
				} else if (props.modelValue > props.max) {
					emit('update:modelValue', props.max);
				}
			},
		};
	},
});
</script>
