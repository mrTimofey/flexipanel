<template lang="pug">
.form-field-textarea
	slot(name="label")
	textarea.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		:rows="height"
		:class="{ 'is-invalid': !!errors || maxLength && length > maxLength }"
		@input="onInput($event)"
	)
	div(v-if="maxLength")
		small(:class="length > maxLength ? 'text-danger' : 'text-muted'") {{ trans('symbolCount') }}: {{ length }} / {{ maxLength }}
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed } from 'vue';
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
		height: {
			type: Number,
			default: 5,
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
