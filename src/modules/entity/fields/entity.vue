<template lang="pug">
.form-field-entity
	.form-field-entity-label
		slot(name="label")
	.d-flex.align-items-center(v-if="modelValue")
		.form-field-entity-selection {{ modelValue }}
		button.btn.btn-outline-danger.btn-sm.ms-2(type="button" @click.prevent="clearValue()")
			i.fa-solid.fa-times
	.text-muted(v-else) {{ placeholder || trans('nothingSelected') }}
	.position-relative(v-click-outside="selecting ? onClickOutsideSelector : null")
		button.btn.btn-primary.btn-sm(
			type="button"
			@click.prevent="selecting = true"
		)
			i.fa-solid.fa-pencil
		.position-absolute.bg-light.shadow-lg.border.rounded.top-0.left-0.pt-2(
			v-show="selecting"
			style="min-width:280px;max-width:100%;z-index:5;overflow:hidden"
		)
			.d-flex.justify-content-center(style="max-height:480px;width:100%")
				keep-alive
					entity-view(
						v-if="selecting"
						no-actions
						:entity="entity"
						:view="view"
						v-model:page="page"
						v-model:perPage="perPage"
						v-model:filters="filters"
						v-model:sort="sort"
						@item-click="setValue($event)"
					)
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, ref } from '@vue/runtime-core';
import { useTranslator } from '../../vue-composition-utils';
import EntityView from '../entity-view.vue';
import clickOutside from '../../click-outside';

export default defineComponent({
	components: { EntityView },
	directives: { clickOutside },
	props: {
		modelValue: {
			type: [String, Number, Boolean, Object, Array] as PropType<unknown | unknown[]>,
			default: null,
		},
		entity: {
			type: String,
			required: true,
		},
		view: {
			type: String,
			default: '',
		},
		key: {
			type: String,
			default: '',
		},
		placeholder: {
			type: String,
			default: '',
		},
		multiple: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const page = ref<number>(1);
		const perPage = ref<number | undefined>(undefined);
		const filters = ref<Record<string, unknown>>({});
		const sort = ref<Record<string, unknown>>({});
		const selecting = ref(false);

		return {
			...useTranslator(),
			page,
			perPage,
			filters,
			sort,
			selecting,
			setValue(e: { id: string; item: Record<string, unknown> }) {
				const oldValue = Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue;
				const newValue = props.key ? e.item[props.key] : e.id;
				selecting.value = false;
				if (oldValue === newValue) {
					return;
				}
				emit('update:modelValue', props.multiple ? [newValue] : newValue);
			},
			clearValue() {
				if (props.modelValue === null) {
					return;
				}
				emit('update:modelValue', props.multiple ? [] : null);
			},
			onClickOutsideSelector() {
				selecting.value = false;
			},
		};
	},
});
</script>
