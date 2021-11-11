<template lang="pug">
.form-field-date
	slot(name="label")
	input.form-control.form-control-sm(
		type="date"
		v-model="dateValue"
		:placeholder="placeholder"
		:disabled="disabled"
	)
</template>

<script lang="ts">
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
						emit('update:modelValue', v);
					}
				},
			}),
		};
	},
});
</script>
