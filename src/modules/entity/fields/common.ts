/* eslint-disable import/prefer-default-export */
import type { PropType } from 'vue';
import type { IRegisteredEntity } from '..';
import { getCommonProps as getBaseCommonProps } from '../../form/fields/common';

const commonEntityFieldProps = {
	entityMeta: {
		type: Object as PropType<IRegisteredEntity>,
		default: null,
	},
	entityItem: {
		type: Object,
		default: null,
	},
	entityItemId: {
		type: String,
		default: '',
	},
	relatedItems: {
		type: Object as PropType<Record<string, Record<string, Record<string, unknown>>>>,
		default: () => ({}),
	},
};

export function getCommonProps<T>(modelValue: T) {
	return {
		...getBaseCommonProps(modelValue),
		...commonEntityFieldProps,
	};
}
