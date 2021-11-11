<template lang="pug">
.form-field-entity
	.form-field-entity-label
		slot(name="label")
	.position-relative
		.entity-selection.px-2.py-1.border.rounded(
			style="font-size:0.875rem"
			@click.prevent="selecting = true"
		)
			div(v-for="item in modelValueArray")
				.d-flex.align-items-center
					span {{ tpl(displayTemplate, { value: item, item: getRelatedItem(item) }) }}
					!=' '
					//- .btn-close(type="button" @click.prevent="clearValue()")
			.text-muted(v-if="modelValueArray.length === 0") {{ placeholder || trans('nothingSelected') }}
		.entity-select-dropdown.position-absolute.bg-light.shadow-lg.border.rounded.top-0.left-0.pt-2(
			v-show="selecting"
			style="min-width:280px;max-width:100%;z-index:5;overflow:hidden"
			v-click-outside="selecting ? onClickOutsideSelector : null"
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
import { defineComponent, ref, computed, reactive } from '@vue/runtime-core';
import { useTemplate, useTranslator } from '../../vue-composition-utils';
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
		fieldKey: {
			type: String,
			default: '',
		},
		entity: {
			type: String,
			required: true,
		},
		relatedItems: {
			type: Object as PropType<Record<string, Record<string, Record<string, unknown>>>>,
			default: () => ({}),
		},
		view: {
			type: String,
			default: '',
		},
		key: {
			type: String,
			default: '',
		},
		displayTemplate: {
			type: String,
			default: '{{=it.item.label || it.item.name || it.item.title}} [#{{=it.value}}]',
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
		const modelValueArray = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : (props.modelValue && [props.modelValue]) || []));
		const internalRelatedItems = reactive<Record<string, unknown>>({});

		return {
			...useTranslator(),
			...useTemplate(),
			page,
			perPage,
			filters,
			sort,
			selecting,
			modelValueArray,
			setValue(e: { id: string; item: Record<string, unknown> }) {
				const oldValue = Array.isArray(props.modelValue) ? props.modelValue[0] : props.modelValue;
				const newValue = props.key ? e.item[props.key] : e.id;
				internalRelatedItems[e.id] = e.item;
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
			getRelatedItem(id: string): Record<string, unknown> {
				return props.relatedItems[props.fieldKey]?.[id] || internalRelatedItems[id] || {};
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.entity-selection
	cursor pointer
	&:hover
		background-color var(--bs-light)
.entity-select-dropdown
	animation entity-dropdown-appear 0.1s ease-out
@keyframes entity-dropdown-appear
	0%
		opacity 0
	100%
		opacity 1
@keyframes entity-dropdown-appear
	0%
		transform translateY(-2px)
	100%
		transform none
</style>
