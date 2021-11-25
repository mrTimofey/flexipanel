<template lang="pug">
.form-field-object(:class="{ inline }")
	.form-field-object-label
		slot(name="label")
	.form-field-object-fields
		.form-field-object-item(v-for="(_, k) in fields")
			entity-item-form-field(
				v-if="store"
				:field="getFieldDefinition(k)"
				:store="store"
				@change="updateItem(k, $event)"
			)
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { inject, defineComponent } from '@vue/runtime-core';
import type { IField, IRegisteredEntity } from '..';
import EntityItemFormField, { storeInjectKey } from '../entity-item-form-field.vue';

export default defineComponent({
	components: { EntityItemFormField },
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
		return {
			store: inject(storeInjectKey),
			getFieldDefinition(key: string): Required<IField> {
				const field = props.fields[key];
				return {
					key: `${props.fieldKey}.${key}`,
					type: (field.type && `${field.type}`) || 'text',
					label: (field.label && `${field.label}`) || '',
					inlineRelated: false,
					createProps: {},
					updateProps: {},
					props: { ...field.props, disabled: props.disabled },
				};
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
	.form-field-object-fields
		display flex
		justify-content stretch
		margin-left -0.25rem
		padding 0.125rem 0
	.form-field-object-item
		flex 1 1 0
		padding-left 0.25rem
</style>
