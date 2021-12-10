<template lang="pug">
.form-field-text
	slot(name="label")
	input.form-control.form-control-sm(
		ref="input"
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		:class="{ 'is-invalid': !!errors || maxLength && length > maxLength }"
		@input="onInput($event)"
	)
	div(v-if="maxLength")
		small(:class="length > maxLength ? 'text-danger' : 'text-muted'") {{ trans('symbolCount') }}: {{ length }} / {{ maxLength }}
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed, ref, watch } from '@vue/runtime-core';
import { useTranslator } from '../../vue-composition-utils';

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
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
		maxLength: {
			type: Number,
			default: 0,
		},
		autofocus: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const input = ref<HTMLInputElement | null>(null);
		watch(
			input,
			() => {
				if (input.value && props.autofocus) {
					input.value.focus();
				}
			},
			{ immediate: true },
		);
		return {
			...useTranslator(),
			input,
			onInput(e: Event) {
				const value = (e.target as HTMLInputElement).value.trim();
				if (value !== props.modelValue) {
					emit('update:modelValue', value);
				}
			},
			length: computed(() => (props.modelValue && props.modelValue.length) || 0),
		};
	},
});
</script>
