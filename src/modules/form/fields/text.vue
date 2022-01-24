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
import { defineComponent, computed, ref, watch } from 'vue';
import { useTranslator } from '../../vue-composition-utils';
import { getCommonProps } from './common';

export default defineComponent({
	props: {
		...getCommonProps({
			type: String,
			default: '',
		}),
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
			[input, () => props.autofocus],
			() => {
				if (input.value && props.autofocus) {
					input.value.focus();
					input.value.select();
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
