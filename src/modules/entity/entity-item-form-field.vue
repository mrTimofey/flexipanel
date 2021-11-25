<template lang="pug">
component(
	:is="fieldComponent(field.type)"
	:field-key="field.key"
	:errors="store.formErrors[field.key]"
	:model-value="fieldValue"
	:entity-meta="store.entityMeta"
	:entity-item="store.formItem"
	:entity-item-id="store.itemId"
	:related-items="store.relatedItems"
	v-bind="{ ...field.props, ...field[store.itemId ? 'updateProps' : 'createProps'] }"
	@update:model-value="onChange ? onChange($event) : store.updateFormFieldValue(field.key, $event)"
)
	template(#label) {{ field.label }}
</template>

<script lang="ts">
import type { InjectionKey, PropType, ComputedRef } from '@vue/runtime-core';
import { defineComponent, provide, computed } from '@vue/runtime-core';
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
			return null;
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
			type: Object as PropType<EntityItemStore>,
			required: true,
		},
		onChange: {
			type: Function as PropType<(value: unknown) => unknown>,
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
			fieldComponent(type: string) {
				return entityManager.getFieldType(type)?.component;
			},
			fieldValue: computed(() => deep(props.store.formItem, props.field.key.split('.'))),
		};
	},
});
</script>
