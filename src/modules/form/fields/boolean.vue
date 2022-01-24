<template lang="pug">
.form-field-boolean
	label.form-check(@click.prevent="toggle()")
		input.form-check-input(
			type="checkbox"
			:disabled="disabled"
			:checked="modelValue"
			:class="{ 'is-invalid': !!errors }"
		)
		span.form-check-label
			slot(name="label")
	.invalid-feedback.d-block(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getCommonProps } from './common';

export default defineComponent({
	props: getCommonProps({
		type: Boolean,
		default: false,
	}),
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		return {
			toggle() {
				emit('update:modelValue', !props.modelValue);
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.form-check
	cursor pointer
</style>
