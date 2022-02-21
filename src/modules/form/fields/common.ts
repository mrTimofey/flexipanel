/* eslint-disable import/prefer-default-export */
import type { PropType } from 'vue';

const commonFieldProps = {
	disabled: {
		type: Boolean,
		default: false,
	},
	errors: {
		type: Array as PropType<string[] | null>,
		default: null,
	},
	placeholder: {
		type: String,
		default: '',
	},
	required: {
		type: Boolean,
		default: false,
	},
	fieldKey: {
		type: String,
		default: '',
	},
	context: {
		type: Object,
		default: null,
	},
};

export function getCommonProps<T>(modelValue: T) {
	return {
		...commonFieldProps,
		modelValue,
	};
}
