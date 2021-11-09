<template lang="pug">
.form-field-textarea
	slot(name="label")
	textarea.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		:rows="height"
		@input="onInput($event)"
	)
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		height: {
			type: Number,
			default: 5,
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
