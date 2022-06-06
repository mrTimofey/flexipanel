<template lang="pug">
.form-field-text
	slot(name="label")
	input.form-control.form-control-sm(
		ref="inputEl"
		:disabled="disabled"
		:placeholder="placeholder"
		:class="{ 'is-invalid': !!errors || maxLength && length > maxLength }"
		@input="onInput($event)"
		@blur="onInput($event)"
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
		const inputEl = ref<HTMLInputElement | null>(null);
		watch(
			[inputEl, () => props.autofocus],
			() => {
				if (!inputEl.value) {
					return;
				}
				if (props.autofocus) {
					inputEl.value.focus();
					inputEl.value.select();
				}
				inputEl.value.value = props.modelValue;
			},
			{ immediate: true },
		);
		watch(
			() => props.modelValue,
			() => {
				if (!inputEl.value || document.activeElement === inputEl.value) {
					return;
				}
				inputEl.value.value = props.modelValue;
			},
			{ immediate: true },
		);
		return {
			...useTranslator(),
			inputEl,
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
