<template lang="pug">
component(
	:is="fieldComponent"
	:field-key="field.key"
	:errors="store.formErrors[field.key]"
	:context="fullContext"
	:model-value="fieldValue"
	:form-object="store.formItem"
	:form-object-id="store.itemId"
	:related-items="store.relatedItems"
	v-bind="{ ...field.props, ...(store ? field[store.itemId ? 'updateProps' : 'createProps'] : {}), ...fieldProps }"
	@update:model-value="store.updateFormFieldValue(field.key, $event)"
	@update-field="store.updateFormFieldValue($event.key, $event.value, !!$event.immediate)"
)
	template(#label) {{ field.label }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed } from 'vue';
import type { IField } from '.';
import FormFields from '../form/fields';
import { get } from '../vue-composition-utils';
import type EntityItemStore from './stores/item';

function deep(obj: Record<string, unknown>, path: string[]): unknown {
	let current = obj;
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
			type: Object as PropType<EntityItemStore>,
			required: true,
		},
		context: {
			type: Object,
			default: null,
		},
		fieldProps: {
			type: Object,
			default: null,
		},
	},
	emits: ['change'],
	setup(props) {
		const formFields = get(FormFields);
		return {
			fieldComponent: computed(() => formFields.getComponent(props.field.type)),
			fieldValue: computed(() => deep(props.store.formItem, props.field.key.split('.'))),
			fullContext: computed(() => ({ ...props.store.relatedItems, ...props.context })),
		};
	},
});
</script>
