<template lang="pug">
.form-field-integer
	slot(name="label")
	input.form-control.form-control-sm(
		:disabled="disabled"
		:placeholder="placeholder"
		:value="modelValue"
		:class="{ 'is-invalid': !!errors }"
		@input="onInput($event)"
		@blur="onBlur()"
	)
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			type: [Number, String],
			default: 0,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		min: {
			type: Number,
			default: -Infinity,
		},
		max: {
			type: Number,
			default: Infinity,
		},
		default: {
			type: Number,
			default: null,
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
				const target = e.target as HTMLInputElement;
				const real = target.value;
				const v = real.replace(/(?!^-)[^0-9]/g, '');
				if (v !== real) {
					target.value = v;
				}
				if (v !== '-') {
					const newValue = v === '' ? props.default : Number(v);
					if (props.modelValue !== newValue) {
						emit('update:modelValue', newValue);
					}
				}
			},
			onBlur() {
				if (Number.isNaN(props.modelValue)) {
					return;
				}
				if (props.modelValue !== 0 && !props.modelValue) {
					emit('update:modelValue', props.default);
				} else if (props.modelValue < props.min) {
					emit('update:modelValue', props.min);
				} else if (props.modelValue > props.max) {
					emit('update:modelValue', props.max);
				}
			},
		};
	},
});
</script>
