<template lang="pug">
.form-field-object(:class="{ inline }")
	.form-field-object-label
		slot(name="label")
	.form-field-object-fields
		.form-field-object-item(v-for="(field, k) in availableFields" :style="field.def.style")
			component(
				:is="field.component"
				:field-key="`${fieldKey}.${k}`"
				:context="context"
				:form-object="formObject"
				:form-object-id="formObjectId"
				:model-value="modelValue?.[k]"
				v-bind="{ disabled, ...field.def.props, ...(formObjectId ? field.def.updateProps : field.def.createProps) }"
				@update:model-value="updateItem(k, $event)"
			)
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import type { Component, PropType } from 'vue';
import { watch, computed, defineComponent } from 'vue';
import FormFields from '.';
import { get } from '../../vue-composition-utils';
import { getCommonProps } from './common';

export interface IField {
	type?: string;
	props?: Record<string, unknown>;
	updateProps?: Record<string, unknown>;
	createProps?: Record<string, unknown>;
	style?: string;
	condition?: (value: Record<string, unknown>) => boolean;
}

export default defineComponent({
	props: {
		...getCommonProps({
			type: Object as PropType<Record<string, unknown> | null>,
			default: null,
		}),
		fields: {
			type: Object as PropType<IField>,
			required: true,
		},
		inline: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const formFields = get(FormFields);
		const createEmptyObject = () => {
			const obj: Record<string, null> = {};
			Object.keys(props.fields).forEach((k) => {
				obj[k] = null;
			});
			return obj;
		};
		const availableFields = computed(() => {
			const fields: Record<string, { def: IField; component: Component | null }> = {};
			Object.entries(props.fields).forEach(([key, def]) => {
				if (!def.condition || def.condition(props.modelValue)) {
					fields[key] = {
						def,
						component: formFields.getComponent(def.type || 'text'),
					};
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
			availableFields,
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
