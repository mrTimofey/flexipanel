<template lang="pug">
.form-field-datetime
	slot(name="label")
	.input-group
		input.form-control.form-control-sm.flex-grow-0(type="date"
			:value="date"
			:disabled="disabled"
			:placeholder="placeholder"
			:class="{ 'is-invalid': !!errors, empty: !modelValue }"
			@blur="onDateBlur($event)"
		)
		input.form-control.form-control-sm.flex-grow-0(type="time"
			:value="time"
			:disabled="disabled"
			:placeholder="timePlaceholder"
			:class="{ 'is-invalid': !!errors, empty: !modelValue }"
			@blur="onTimeBlur($event)"
		)
	.invalid-feedback.d-block(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, watchEffect } from 'vue';
import { getCommonProps } from './common';

type FormatterFn = {
	modelToInternal(value: unknown): string | null;
	internalToModel(value: string): unknown;
};

const dateFormatters = {
	sql: {
		modelToInternal(value) {
			if (typeof value === 'string') {
				return value;
			}
			return null;
		},
		internalToModel(value) {
			return value;
		},
	} as FormatterFn,
	timestamp: {
		modelToInternal(value) {
			if (typeof value === 'number' && !Number.isNaN(value)) {
				const date = new Date(value * 1000);
				// normalize timezone to make the date time
				date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
				return date.toISOString().replace('T', ' ').substring(0, 19);
			}
			return null;
		},
		internalToModel(value) {
			return new Date(value).getTime() / 1000;
		},
	} as FormatterFn,
};

export default defineComponent({
	props: {
		...getCommonProps({
			type: [Number, String],
			default: '',
		}),
		timePlaceholder: {
			type: String,
			default: '',
		},
		formatter: {
			type: String as PropType<keyof typeof dateFormatters | FormatterFn>,
			default: 'sql',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const formatter = computed<FormatterFn>(() => (typeof props.formatter === 'string' ? dateFormatters[props.formatter] : props.formatter));
		const time = computed<string>({
			get() {
				const value = formatter.value.modelToInternal(props.modelValue);
				return value ? value.substring(11, 16) : '';
			},
			set(v) {
				const dateValue = (formatter.value.modelToInternal(props.modelValue) || new Date().toISOString()).substring(0, 10);
				emit('update:modelValue', formatter.value.internalToModel(`${dateValue} ${(v || '00:00').substring(0, 5)}:00`));
			},
		});
		const date = computed<string>({
			get() {
				const value = formatter.value.modelToInternal(props.modelValue);
				return value ? value.substring(0, 10) : '';
			},
			set(v) {
				const timeValue = (formatter.value.modelToInternal(props.modelValue) || new Date().toISOString()).substring(11, 16);
				emit('update:modelValue', v ? formatter.value.internalToModel(`${v} ${timeValue}:00`) : '');
			},
		});
		watchEffect(() => {
			if (props.modelValue !== 'now') {
				return;
			}
			const now = new Date();
			now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
			emit('update:modelValue', formatter.value.internalToModel(now.toISOString().replace('T', ' ').substring(0, 19)));
		});
		return {
			date,
			time,
			onTimeBlur(e: Event) {
				const input = e.target as HTMLInputElement;
				if (!input.value && time.value) {
					input.value = time.value;
				} else {
					time.value = input.value;
				}
			},
			onDateBlur(e: Event) {
				const input = e.target as HTMLInputElement;
				if (!input.value && date.value) {
					input.value = date.value;
				} else {
					date.value = input.value;
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
