<template lang="pug">
component(
	:is="getFieldComponent(field.type)"
	:field-key="field.key"
	:errors="store?.formErrors[field.key]"
	:context="context"
	:model-value="fieldValue"
	:entity-meta="store?.entityMeta"
	:entity-item="store?.formItem"
	:entity-item-id="store?.itemId"
	:related-items="store?.relatedItems"
	v-bind="{ ...field.props, ...(store ? field[store.itemId ? 'updateProps' : 'createProps'] : {}), ...fieldProps }"
	@update:model-value="onChange ? onChange($event) : store?.updateFormFieldValue(field.key, $event)"
	@update-field="store?.updateFormFieldValue($event.key, $event.value, !!$event.immediate)"
)
	template(#label) {{ field.label }}
</template>

<script lang="ts">
import type { InjectionKey, PropType, ComputedRef } from 'vue';
import { defineComponent, provide, computed } from 'vue';
import type { IField } from '.';
import EntityManager from '.';
import { get } from '../vue-composition-utils';
import type EntityItemStore from './stores/item';

// for internal usage only, makes field composition possible
export const storeInjectKey: InjectionKey<ComputedRef<EntityItemStore>> = Symbol('entityItemStore');

function deep(obj: Record<string, unknown>, path: string[]): unknown {
	let current = obj;
	// eslint-disable-next-line no-restricted-syntax
	for (const prop of path) {
		current = current[prop] as Record<string, unknown>;
		if (current == null || typeof current !== 'object') {
			break;
		}
	}
	return current;
}

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Required<IField>>,
			required: true,
		},
		store: {
			type: Object as PropType<EntityItemStore | null>,
			default: null,
		},
		value: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: [String, Number, Object] as PropType<any>,
			default: null,
		},
		context: {
			type: Object,
			default: null,
		},
		onChange: {
			type: Function as PropType<(value: unknown) => unknown>,
			default: null,
		},
		fieldComponent: {
			type: Object,
			default: null,
		},
		fieldProps: {
			type: Object,
			default: null,
		},
	},
	setup(props) {
		const entityManager = get(EntityManager);
		provide(
			storeInjectKey,
			computed(() => props.store),
		);
		return {
			getFieldComponent(type: string) {
				return props.fieldComponent || entityManager.getFieldType(type)?.component;
			},
			fieldValue: computed(() => (props.store ? deep(props.store.formItem, props.field.key.split('.')) : props.value)),
		};
	},
});
</script>
