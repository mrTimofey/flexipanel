<template lang="pug">
.form-field-float
	slot(name="label")
	input.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		:class="{ 'is-invalid': !!errors }"
		@input="onInput($event)"
		@blur="onBlur()"
	)
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { getCommonProps } from './common';

export default defineComponent({
	props: {
		...getCommonProps({
			type: Number,
			default: null,
		}),
		min: {
			type: Number,
			default: -Infinity,
		},
		max: {
			type: Number,
			default: Infinity,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			onInput(e: Event) {
				const input = e.target as HTMLInputElement;
				const real = input.value.toString();
				let pieces = real.replace(/(?!^-)[^0-9.,]/g, '').split(/[.,]/);
				if (pieces.length > 2) {
					pieces = [pieces[0], pieces.slice(1).join('')];
				}
				const v = pieces.join('.');
				if (v !== real) {
					input.value = v;
				}
				if (v !== '-') {
					const newValue = v === '' ? null : parseFloat(v);
					if (props.modelValue !== newValue) {
						emit('update:modelValue', newValue);
					}
				}
			},
			onBlur() {
				if (Number.isNaN(props.modelValue) || props.modelValue === null) {
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
