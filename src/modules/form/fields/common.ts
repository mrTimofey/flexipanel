/* eslint-disable import/prefer-default-export */
import type { PropType } from 'vue';

const commonFieldProps = {
	disabled: {
		type: Boolean,
		default: false,
	},
	// errors for the field instance
	errors: {
		type: Array as PropType<string[] | null>,
		default: null,
	},
	// form-wide errors keyed by field key path (useful for composite fields like array or object)
	// keys should be in format `rootField.subField.subSubField...` ('items.0.title', 'tag.name', etc.)
	allErrors: {
		type: Object as PropType<Record<string, string[]> | null>,
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
	formObject: {
		type: Object,
		default: null,
	},
	formObjectId: {
		type: [String, Number],
		default: '',
	},
};

export function getCommonProps<T>(modelValue: T) {
	return {
		...commonFieldProps,
		modelValue,
	};
}
