<template lang="pug">
component(
	:is="fieldComponent"
	v-bind="fieldProps"
	:model-value="item[prop]"
	:field-key="prop"
	:form-object="item"
	:context="context"
	@update:model-value="debounceAwareEmit($event)"
)
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import FormFields from '../../form/fields';
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
		const formFields = get(FormFields);
		const debounceAwareEmit = computed<(value: unknown) => void>(() => {
			const fn = (value: unknown) => {
				emit('input', { [props.prop]: value });
			};
			return props.debounce ? debounce(fn, typeof props.debounce === 'number' ? props.debounce : undefined) : fn;
		});

		return {
			fieldComponent: computed(() => formFields.getComponent(props.fieldType)),
			debounceAwareEmit,
		};
	},
});
</script>
