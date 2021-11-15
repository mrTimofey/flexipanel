<template lang="pug">
.form-field-text
	slot(name="label")
	input.form-control.form-control-sm(
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
import { defineComponent, computed } from '@vue/runtime-core';
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
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			...useTranslator(),
			onInput(e: Event) {
				const { value } = e.target as HTMLInputElement;
				emit('update:modelValue', value);
			},
			length: computed(() => (props.modelValue && props.modelValue.length) || 0),
		};
	},
});
</script>
