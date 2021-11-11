<template lang="pug">
.form-field-entity
	.form-field-entity-label
		slot(name="label")
	.form-field-entity-wrap.position-relative(
		@keypress.enter="selecting = true"
		@keypress.space="selecting = true"
		@keypress.escape="selecting = false"
		@blur="onBlur($event)"
		tabindex="0"
		:class="{ selecting }"
	)
		.entity-selection.px-2.py-1.rounded(
			style="font-size:0.875rem"
			@click.prevent="selecting = true"
		)
			div(v-for="item in modelValueArray")
				.d-flex.align-items-center
					span {{ getDisplayValue(item) }}
					!=' '
					//- .btn-close(type="button" @click.prevent="clearValue()")
			.text-muted(v-if="modelValueArray.length === 0") {{ placeholder || trans('nothingSelected') }}
			span.dropdown-toggle
		.entity-select-dropdown.position-absolute.bg-light.rounded.top-0.left-0.pt-2(
			v-show="selecting"
			style="min-width:280px;width:100%;z-index:5;overflow:hidden"
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
		const { tpl } = useTemplate();
		const page = ref<number>(1);
		const perPage = ref<number | undefined>(undefined);
		const filters = ref<Record<string, unknown>>({});
		const sort = ref<Record<string, unknown>>({});
		const selecting = ref(false);
		const modelValueArray = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : (props.modelValue && [props.modelValue]) || []));
		const internalRelatedItems = reactive<Record<string, unknown>>({});

		return {
			...useTranslator(),
			page,
			perPage,
			filters,
			sort,
			selecting,
			modelValueArray,
			onBlur(e: FocusEvent) {
				// hide selector if there is no focus within the element
				if (!(e.currentTarget as Node)?.contains(e.relatedTarget as Node)) {
					selecting.value = false;
				}
			},
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
			getDisplayValue(value: unknown) {
				const valueString = `${value}`;
				return tpl(props.displayTemplate, {
					value,
					item: props.relatedItems[props.fieldKey]?.[valueString] || internalRelatedItems[valueString] || {},
				});
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.form-field-entity-wrap
	&:focus
		outline 0
.entity-selection
	cursor pointer
	font-size 0.875rem
	border 1px solid var(--bs-gray-400)
	border-radius 0.25rem
	&:hover
		background-color var(--bs-light)
.form-field-entity-wrap:not(.selecting):focus-within .entity-selection, .entity-select-dropdown
	border 1px solid #86b7fe
	box-shadow unquote('0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.25)')
.entity-select-dropdown
	animation entity-dropdown-appear 0.1s ease-out
.dropdown-toggle
	position absolute
	top 50%
	right 0.5rem
	margin auto
	transform translateY(-50%)
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
