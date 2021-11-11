<template lang="pug">
.form-field-entity
	.form-field-entity-label
		slot(name="label")
	.form-field-entity-wrap(
		@keypress.enter="selecting = true"
		@keypress.space="selecting = true"
		@keypress.escape="selecting = false"
		@blur="onBlur($event)"
		tabindex="0"
		:class="{ selecting }"
	)
		.entity-selection.ps-1.pe-3.py-1.rounded(
			style="font-size:0.875rem"
			@click.prevent="selecting = true"
		)
			.px-1.text-muted(v-if="modelValueArray.length === 0") {{ placeholder || trans('nothingSelected') }}
			ol.list-unstyled.m-0(v-else :class="multiple ? 'd-flex' : ''")
				li.ps-1.me-1.d-flex(
					v-for="(item, i) in modelValueArray" style="--bs-bg-opacity:0.25"
					:class="multiple ? 'bg-secondary rounded' : ''"
				)

					.me-1.flex-grow-1 {{ getDisplayValue(item) }}
					!=' '
					button.btn-entity-item-remove.rounded(
						type="button"
						@click.prevent.stop="removeItem(i)"
					)
			span.dropdown-toggle
		.entity-select-dropdown.bg-light.rounded.pt-2(
			v-show="selecting"
			v-click-outside="selecting ? onClickOutsideSelector : null"
		)
			.entity-select-dropdown-content
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
						@item-click="addItem($event)"
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
		const modelValueArray = computed<unknown[]>(() => {
			if (Array.isArray(props.modelValue)) {
				return props.modelValue;
			}
			return props.modelValue == null ? [] : [props.modelValue];
		});
		const internalRelatedItems = reactive<Record<string, unknown>>({});

		const emitValue = (newValue: unknown[]) => {
			if (props.multiple) {
				emit('update:modelValue', newValue);
			} else {
				emit('update:modelValue', newValue.length > 0 ? newValue[newValue.length - 1] : null);
			}
		};

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
			removeItem(i: number) {
				if (modelValueArray.value.length <= i) {
					return;
				}
				const newValue = modelValueArray.value.slice();
				newValue.splice(i, 1);
				emitValue(newValue);
			},
			addItem(e: { id: string; item: Record<string, unknown> }) {
				if (!props.multiple) {
					selecting.value = false;
				}
				const item = props.key ? e.item[props.key] : e.id;
				if (modelValueArray.value.includes(item)) {
					return;
				}
				internalRelatedItems[e.id] = e.item;
				emitValue([...modelValueArray.value, item]);
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
	position relative
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
	position absolute
	top 0
	left 0
	right 0
	min-width 280px
	z-index 5
	overflow hidden
	animation entity-dropdown-appear 0.1s ease-out
.entity-select-dropdown-content
	display flex
	justify-content center
	max-height 480px
	width 100%
.dropdown-toggle
	position absolute
	top 50%
	right 0.5rem
	margin auto
	transform translateY(-50%)
.btn-entity-item-remove
	display block
	width 1.5em
	position relative
	background unquote('rgba(var(--bs-danger-rgb), 0.8)')
	border none
	padding 0
	margin 0
	color white
	&:hover
		background var(--bs-danger)
	&::before, &::after
		content ''
		display block
		border-top 1px solid
		border-bottom @border-top
		border-radius 2px
		position absolute
		top 50%
		right 0.25rem
		left 0.25rem
		margin-top -1px
		backface-visibility hidden
	&::before
		transform rotate(45deg)
	&::after
		transform rotate(-45deg)
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
