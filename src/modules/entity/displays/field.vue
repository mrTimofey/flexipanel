<template lang="pug">
component(
	:is="fieldComponent"
	v-bind="fieldProps"
	:model-value="item[prop]"
	:field-key="prop"
	:entity-item="item"
	:context="context || undefined"
	@update:model-value="debounceAwareEmit($event)"
)
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import EntityManager from '..';
import { get, debounce } from '../../vue-composition-utils';

export default defineComponent({
	name: 'FieldDisplay',
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
		context: {
			type: Object,
			default: null,
		},
		debounce: {
			type: [Boolean, Number],
			default: false,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		const debounceAwareEmit = computed<(value: unknown) => void>(() => {
			const fn = (value: unknown) => {
				emit('input', { [props.prop]: value });
			};
			return props.debounce ? debounce(fn, typeof props.debounce === 'number' ? props.debounce : undefined) : fn;
		});

		return {
			fieldComponent: computed(() => entityManager.getFieldType(props.fieldType)?.component),
			debounceAwareEmit,
		};
	},
});
</script>
