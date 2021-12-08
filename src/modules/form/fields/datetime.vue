<template lang="pug">
.form-field-datetime
	slot(name="label")
	.input-group
		input.form-control.form-control-sm.flex-grow-0(type="date"
			v-model="date"
			:disabled="disabled"
			:placeholder="placeholder"
			:class="{ 'is-invalid': !!errors, empty: !modelValue }"
		)
		input.form-control.form-control-sm.flex-grow-0(type="time"
			v-model="time"
			:disabled="disabled"
			:placeholder="timePlaceholder"
			:class="{ 'is-invalid': !!errors, empty: !modelValue }"
			@blur="onTimeBlur($event)"
		)
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, watchEffect } from 'vue';

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
		timePlaceholder: {
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
		const time = computed<string>({
			get() {
				return props.modelValue ? props.modelValue.substring(11, 16) : '';
			},
			set(v) {
				const dateValue = props.modelValue ? props.modelValue.substring(0, 10) : new Date().toISOString().substring(0, 10);
				emit('update:modelValue', `${dateValue} ${(v || '00:00').substring(0, 5)}:00`);
			},
		});
		const date = computed<string>({
			get() {
				return props.modelValue ? props.modelValue.substring(0, 10) : '';
			},
			set(v) {
				const timeValue = props.modelValue ? props.modelValue.substring(11, 16) : '';
				emit('update:modelValue', v ? `${v} ${timeValue || '00:00'}:00` : '');
			},
		});
		watchEffect(() => {
			if (props.modelValue !== 'now') {
				return;
			}
			const now = new Date();
			now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
			emit('update:modelValue', now.toISOString().replace('T', ' ').substring(0, 19));
		});
		return {
			date,
			time,
			onTimeBlur(e: Event) {
				const input = e.target as HTMLInputElement;
				if (!input.value && time.value) {
					input.value = time.value;
				}
			},
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
input[type="date"]
	width 170px
input[type="time"]
	width 170px
</style>
