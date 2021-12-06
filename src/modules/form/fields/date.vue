<template lang="pug">
.form-field-date
	slot(name="label")
	input.form-control.form-control-sm(
		type="date"
		v-model="dateValue"
		:placeholder="placeholder"
		:disabled="disabled"
		:class="{ 'is-invalid': !!errors, empty: !modelValue }"
	)
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed } from '@vue/runtime-core';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			dateValue: computed({
				get() {
					return props.modelValue ? props.modelValue.substr(0, 10) : '';
				},
				set(v: string) {
					if (!v && props.modelValue) {
						emit('update:modelValue', null);
					} else if (v !== props.modelValue) {
						emit('update:modelValue', v.substr(0, 10));
					}
				},
			}),
		};
	},
});
</script>

<style lang="stylus" scoped>
input.empty:not(:focus)
	color transparent
	&::before
		color var(--bs-gray-600)
		content attr(placeholder)
input
	width 170px
</style>
