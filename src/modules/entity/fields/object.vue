<template lang="pug">
.form-field-object(:class="{ inline }")
	.form-field-object-label
		slot(name="label")
	.form-field-object-item(v-for="(field, k) in fields")
		component(
			:key="k"
			:is="fieldComponent(field.type)"
			v-bind="field.props"
			:field-key="`${fieldKey}.${k}`"
			:entity="entity"
			:entity-item="entityItem"
			:entity-item-id="entityItemId"
			:related-items="relatedItems"
			:model-value="modelValue && modelValue[k] !== undefined ? modelValue[k] : null"
			:disabled="disabled"
			@update:model-value="updateItem(k, $event)"
		)
			template(#label) {{ field.label }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent } from '@vue/runtime-core';
import EntityManager from '..';
import { get } from '../../vue-composition-utils';

export default defineComponent({
	props: {
		modelValue: {
			type: Object as PropType<Record<string, unknown> | null>,
			default: null,
		},
		fieldKey: {
			type: String,
			default: '',
		},
		relatedItems: {
			type: Object as PropType<Record<string, Record<string, Record<string, unknown>>>>,
			default: () => ({}),
		},
		entity: {
			type: String,
			default: '',
		},
		entityItem: {
			type: Object,
			default: null,
		},
		entityItemId: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		fields: {
			type: Object,
			required: true,
		},
		inline: {
			type: Boolean,
			default: false,
		},
		errors: {
			type: Array as PropType<string[] | null>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);

		return {
			fieldComponent(type: string) {
				return entityManager.getFieldType(type)?.component;
			},
			updateItem(k: string, v: unknown) {
				if (props.disabled) {
					return;
				}
				emit('update:modelValue', props.modelValue ? { ...props.modelValue, [k]: v } : { [k]: v });
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.inline
	display flex
	justify-content stretch
	margin-left -0.25rem
	padding 0.125rem 0
	.form-field-object-item
		flex 1 1 0
		padding-left 0.25rem
</style>
