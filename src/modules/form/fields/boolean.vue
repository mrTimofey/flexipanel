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
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

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
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
	},
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
