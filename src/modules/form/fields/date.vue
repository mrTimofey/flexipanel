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
import { defineComponent, computed } from 'vue';
import { getCommonProps } from './common';

export default defineComponent({
	props: getCommonProps({
		type: String,
		default: '',
	}),
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			dateValue: computed({
				get() {
					return props.modelValue ? props.modelValue.substring(0, 10) : '';
				},
				set(v: string) {
					if (!v && props.modelValue) {
						emit('update:modelValue', null);
					} else if (v !== props.modelValue) {
						emit('update:modelValue', v.substring(0, 10));
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
