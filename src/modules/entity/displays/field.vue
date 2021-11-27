<template lang="pug">
component(
	:is="fieldComponent"
	v-bind="fieldProps"
	:model-value="item[prop]"
	:field-key="prop"
	:entity-item="item"
	@update:model-value="onUpdate($event)"
)
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/runtime-core';
import EntityManager from '..';
import { get, debounce } from '../../vue-composition-utils';

export default defineComponent({
	props: {
		item: {
			type: Object,
			required: true,
		},
		prop: {
			type: String,
			default: '',
		},
		fieldType: {
			type: String,
			default: '',
		},
		fieldProps: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		return {
			fieldComponent: computed(() => entityManager.getFieldType(props.fieldType)?.component),
			onUpdate: debounce((value) => {
				emit('input', { [props.prop]: value });
			}),
		};
	},
});
</script>
