<template lang="pug">
.form-field-object(:class="{ inline }")
	.form-field-object-label
		slot(name="label")
	.form-field-object-fields
		.form-field-object-item(v-for="(field, k) in availableFields" :style="field.style")
			entity-item-form-field(
				:field="getFieldDefinition(k)"
				:store="store"
				:value="modelValue?.[k]"
				@change="updateItem(k, $event)"
			)
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { watch, computed, inject, defineComponent } from 'vue';
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
		const createEmptyObject = () => {
			const obj: Record<string, null> = {};
			Object.keys(props.fields).forEach((k) => {
				obj[k] = null;
			});
			return obj;
		};
		const availableFields = computed(() => {
			const fields: Record<string, IField & { style?: string }> = {};
			Object.entries(props.fields).forEach(([key, field]) => {
				if (!field.condition || (typeof field.condition === 'function' && field.condition(props.modelValue))) {
					fields[key] = field;
				}
			});
			return fields;
		});
		// set object fields to empty values when they become unavailable
		watch(availableFields, () => {
			if (!props.modelValue) {
				return;
			}
			const emptyObject = createEmptyObject();
			const nullKeys = Object.keys(props.modelValue).filter((key) => !availableFields.value[key] && emptyObject[key] !== props.modelValue?.[key]);
			if (!nullKeys.length) {
				return;
			}
			emit('update:modelValue', {
				...props.modelValue,
				...nullKeys.reduce((acc, key) => ({ ...acc, [key]: emptyObject[key] }), {}),
			});
		});
		return {
			store: inject(storeInjectKey, undefined),
			availableFields,
			getFieldDefinition(key: string): Required<IField> {
				const field = props.fields[key];
				return {
					key: `${props.fieldKey}.${key}`,
					type: (field.type && `${field.type}`) || 'text',
					label: (field.label && `${field.label}`) || '',
					inlineRelated: false,
					hidden: false,
					default: undefined,
					createProps: {},
					updateProps: {},
					updateOnly: false,
					createOnly: false,
					props: { ...field.props, disabled: props.disabled },
				};
			},
			updateItem(k: string, v: unknown) {
				if (props.disabled) {
					return;
				}
				emit('update:modelValue', props.modelValue ? { ...props.modelValue, [k]: v } : { ...createEmptyObject(), [k]: v });
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
	.form-field-object-fields ::v-deep(.form-field-object-fields)
		padding 0
</style>
