<template lang="pug">
.form-field-textarea
	slot(name="label")
	textarea.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		:rows="height"
		:class="{ 'is-invalid': !!errors }"
		@input="onInput($event)"
	)
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
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
		errors: {
			type: Array as PropType<string[]>,
			default: null,
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
