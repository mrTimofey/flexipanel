<template lang="pug">
.form-field-text
	input.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		@input="onInput($event)"
	)
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';

export default defineComponent({
	props: {
		modelValue: {
			type: [String, Number, Boolean, Object],
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			onInput(e: Event) {
				const { value } = e.target as HTMLInputElement;
				emit('update:modelValue', value);
			},
		};
	},
});
</script>
