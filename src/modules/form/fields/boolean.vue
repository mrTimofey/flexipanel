<template lang="pug">
.form-field-boolean
	label.form-check
		input.form-check-input(
			type="checkbox"
			:disabled="disabled"
			:checked="modelValue"
			@change="onInput($event)"
		)
		span.form-check-label
			slot(name="label")
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';

export default defineComponent({
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			onInput(e: Event) {
				const { checked } = e.target as HTMLInputElement;
				emit('update:modelValue', checked);
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.form-check
	cursor pointer
</style>
