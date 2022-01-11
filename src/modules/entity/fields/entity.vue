<template lang="pug">
.form-field-entity
	modal-dialog(
		v-if="creating && allowCreate"
		:size="itemModalSize"
		:title="trans('createEntityItem')"
		@close="creating = false"
	)
		entity-item(
			:entity-meta="relatedEntityMeta"
			@return="addItem($event)"
		)
	.form-field-entity-label
		slot(name="label")
	.form-field-entity-wrap(
		@keypress.enter="selecting = true"
		@keypress.space="selecting = true"
		@keypress.escape="selecting = false"
		@blur="onBlur($event)"
		tabindex="0"
		:class="{ selecting, 'has-errors': !!errors }"
	)
		.entity-selection.ps-1.pe-3.pt-1(@click.prevent="selecting = true")
			.px-1.pb-1.text-muted(v-if="modelValueArray.length === 0") {{ placeholder || trans('nothingSelected') }}
			draggable-group.list-unstyled.m-0.d-flex.flex-wrap(
				v-else-if="multiple"
				tag="ul"
				v-model="modelValueArray"
				:item-key="getModelItemKey"
			)
				template(#item="{ element, index }")
					li.ps-1.me-1.mb-1.d-flex.bg-secondary.rounded(style="--bs-bg-opacity:0.25;cursor:move")
						.me-1(v-html="getDisplayValue(element)")
						!=' '
						button.btn-entity-item-remove.rounded(
							v-if="!required || modelValueArray.length > 1"
							type="button"
							@click.prevent.stop="removeItem(index)"
						)
							i.fas.fa-trash
			.ps-1.pb-1.me-1.d-flex(v-else)
				span(v-html="getDisplayValue(modelValueArray[0])")
				button.btn-entity-item-remove.rounded.ms-2(
					v-if="!required"
					type="button"
					@click.prevent.stop="removeItem(0)"
				)
					i.fas.fa-trash
		.entity-select-dropdown-wrap(
			v-show="selecting"
			v-click-outside="selecting && !creating ? onClickOutsideSelector : null"
		)
			.entity-select-dropdown.bg-white.rounded.shadow
				.d-flex.border-bottom(v-if="showClearOption")
					button.btn.btn-sm.btn-light.flex-grow-1.rounded-0.text-start(type="button" @click.prevent.stop="clear()") {{ trans('clearField') }}
				.entity-select-dropdown-content.overflow-auto
					keep-alive
						entity-view.flex-grow-1(
							v-if="selecting"
							no-actions
							selectable
							:entity-meta="relatedEntityMeta"
							:view="view"
							:per-page="perPage"
							:per-page-options="[]"
							v-model:page="page"
							v-model:filters="filters"
							v-model:sort="sort"
							@item-click="toggleItem($event)"
						)
							template(#selection="data")
								label.d-block(@click.prevent="toggleItem(data)")
									input.form-check-input(
										:type="multiple ? 'checkbox' : 'radio'"
										:checked="modelValueIds.includes(idField ? data.item[idField] : data.id)"
									)
				.p-1.d-flex(v-if="allowCreate")
					button.btn.btn-primary.btn-sm.flex-grow-1(type="button" @click.prevent="creating = true") {{ trans('createEntityItem') }}
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, ref, computed, reactive, watch } from 'vue';
import DraggableGroup from 'vuedraggable';
import { get, useTemplate, useTranslator } from '../../vue-composition-utils';
import EntityView from '../entity-view.vue';
import EntityItem from '../entity-item.vue';
import type { ModalSize } from '../../modal';
import ModalDialog from '../../modal/modal.vue';
import clickOutside from '../../click-outside';
import type { IRegisteredEntity } from '..';
import EntityManager from '..';

export default defineComponent({
	name: 'EntityField',
	components: { EntityView, ModalDialog, EntityItem, DraggableGroup },
	directives: { clickOutside },
	props: {
		modelValue: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: [String, Number, Boolean, Object, Array] as PropType<any | any[]>,
			default: null,
		},
		fieldKey: {
			type: String,
			default: '',
		},
		entityMeta: {
			type: Object as PropType<IRegisteredEntity>,
			default: null,
		},
		entityItem: {
			type: Object,
			default: null,
		},
		relatedEntity: {
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
		perPage: {
			type: Number,
			default: 25,
		},
		// Static filters.
		optionsFilter: {
			type: Object as PropType<Record<string, unknown>>,
			default: null,
		},
		// Context aware dynamic filters.
		// { [API filter key (example: 'parent')]: object property path string to acquire value from (example: 'parent.id') }
		// Property lookup works with entityItem, relatedItems, context
		optionsFilterMap: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
		displayTemplate: {
			type: String,
			default: '{{=it.item.label || it.item.name || it.item.title}} [#{{=it.value}}]',
		},
		itemModalSize: {
			type: String as PropType<ModalSize>,
			default: 'lg',
		},
		placeholder: {
			type: String,
			default: '',
		},
		multiple: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
		showClearOption: {
			type: Boolean,
			default: false,
		},
		allowCreate: {
			type: Boolean,
			default: false,
		},
		idField: {
			type: String,
			default: '',
		},
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
		context: {
			type: Object,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { tpl } = useTemplate();
		const page = ref<number>(1);
		const filters = ref<Record<string, unknown>>({});
		const sort = ref<Record<string, unknown>>({});
		const selecting = ref(false);
		const creating = ref(false);
		const entityManager = get(EntityManager);
		const relatedEntityMeta = computed(() => entityManager.getEntity(props.relatedEntity));
		const modelValueArray = computed<unknown[]>({
			get() {
				if (Array.isArray(props.modelValue)) {
					return props.modelValue;
				}
				return props.modelValue == null ? [] : [props.modelValue];
			},
			set(newValue) {
				emit('update:modelValue', newValue);
			},
		});
		const modelValueIds = computed<unknown[]>(() => {
			if (!modelValueArray.value.length) {
				return modelValueArray.value;
			}
			if (['string', 'number'].includes(typeof modelValueArray.value[0])) {
				return modelValueArray.value;
			}
			return modelValueArray.value.map((item) => {
				if (typeof item === 'object' && item !== null) {
					return (item as Record<string, unknown>)[props.idField || 'id'] || '';
				}
				return '';
			});
		});
		const internalRelatedItems = reactive<Map<unknown, unknown>>(new Map());

		watch(
			[() => props.optionsFilterMap, () => props.optionsFilter],
			() => {
				const newFilters: Record<string, unknown> = props.optionsFilter ? { ...props.optionsFilter } : {};
				if (props.optionsFilterMap) {
					Object.entries(props.optionsFilterMap).forEach(([key, path]) => {
						const relationPath = path.split('.');
						const fieldName = relationPath.pop();
						if (!fieldName) {
							return;
						}
						let obj = props.entityItem;
						while (relationPath.length && obj) {
							const relatedField = relationPath.shift() as string;
							const relatedObjectOrId = obj[relatedField] || props.context[relatedField];
							obj = typeof relatedObjectOrId === 'object' && relatedObjectOrId ? relatedObjectOrId : props.relatedItems?.[relatedField]?.[relatedObjectOrId];
						}
						if (obj && obj[fieldName]) {
							newFilters[key] = obj[fieldName];
						}
					});
				}
				filters.value = newFilters;
			},
			{ immediate: true },
		);

		const emitValue = (newValue: unknown[]) => {
			if (props.multiple) {
				emit('update:modelValue', newValue);
			} else {
				emit('update:modelValue', newValue.length > 0 ? newValue[newValue.length - 1] : null);
			}
		};

		const removeItem = (i: number) => {
			if (modelValueArray.value.length <= i) {
				return;
			}
			const newValue = modelValueArray.value.slice();
			newValue.splice(i, 1);
			emitValue(newValue);
		};

		const addItem = (e: { id: unknown; item: Record<string, unknown> }) => {
			if (!props.multiple) {
				selecting.value = false;
			}
			creating.value = false;
			const item = props.idField ? e.item[props.idField] : e.id;
			if (modelValueArray.value.includes(item)) {
				return;
			}
			internalRelatedItems.set(item, e.item);
			emitValue([...modelValueArray.value, item]);
		};

		return {
			...useTranslator(),
			relatedEntityMeta,
			page,
			filters,
			sort,
			selecting,
			creating,
			modelValueArray,
			modelValueIds,
			onBlur(e: FocusEvent) {
				// hide selector if there is no focus within the element
				if (!(e.currentTarget as Node)?.contains(e.relatedTarget as Node)) {
					selecting.value = false;
				}
			},
			removeItem,
			addItem,
			toggleItem(e: { id: unknown; item: Record<string, unknown> }) {
				const index = modelValueArray.value.indexOf(props.idField ? e.item[props.idField] : e.id);
				if (index === -1) {
					addItem(e);
				} else {
					removeItem(index);
				}
			},
			clear() {
				if (modelValueArray.value.length > 0) {
					emitValue([]);
				}
				selecting.value = false;
			},
			onClickOutsideSelector() {
				selecting.value = false;
			},
			getDisplayValue(value: unknown) {
				if (typeof value === 'object' && value !== null) {
					return tpl(props.displayTemplate, {
						value: (value as Record<string, unknown>)[props.idField || 'id'],
						item: value,
					});
				}
				const valueString = `${value}`;
				return tpl(props.displayTemplate, {
					value,
					item: props.relatedItems[props.fieldKey.replace(/\.[0-9]+(\.|$)/g, '$1')]?.[valueString] || internalRelatedItems.get(value) || {},
				});
			},
			getModelItemKey(value: unknown) {
				return `${value}`;
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
	position relative
	z-index 1
	cursor pointer
	font-size 0.875rem
	border 1px solid var(--bs-gray-400)
	border-radius 0.25rem
	background-color white
	&::after
		content ''
		display block
		position absolute
		top 0
		right 0
		bottom 0
		width 1.5rem
		background-image url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")
		background-position right 0.25rem center
		background-size 16px 12px
		background-repeat no-repeat
		background-color white
		border-top-right-radius 0.25rem
		border-bottom-right-radius 0.25rem
	.form-field-entity-wrap.selecting > &
		border-bottom-left-radius 0
		border-bottom-right-radius 0
	.form-field-entity-wrap.has-errors > &
		border-color var(--bs-danger)
.form-field-entity-wrap:focus-within > .entity-selection
	border 1px solid #86b7fe
.entity-select-dropdown-wrap
	position absolute
	top 0
	left 0
	right 0
	z-index 10
	animation entity-dropdown-appear 0.1s ease-out
	&:after
		content ''
		display block
		height 5rem
.entity-select-dropdown
	min-width 280px
	border 1px solid #86b7fe
.entity-select-dropdown-content
	display flex
	min-height 240px
	max-height 480px
	width 100%
.dropdown-toggle
	position absolute
	top 50%
	right 0.5rem
	margin auto
	transform translateY(-50%)
.btn-entity-item-remove
	display flex
	align-items center
	justify-content center
	width 1.5em
	position relative
	background unquote('rgba(var(--bs-danger-rgb), 0.8)')
	border none
	padding 0
	margin 0
	color white
	&:hover
		background var(--bs-danger)
	i
		display block
		font-size 12px
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
