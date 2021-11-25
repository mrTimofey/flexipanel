<template lang="pug">
.form-field-entity
	modal-dialog(
		v-if="creating && allowCreate"
		size="lg"
		:title="trans('createEntityItem')"
		@close="creating = false"
	)
		entity-item(
			:entity="relatedEntityMeta"
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
		.entity-selection.ps-1.pe-3.py-1(
			style="font-size:0.875rem"
			@click.prevent="selecting = true"
		)
			.px-1.text-muted(v-if="modelValueArray.length === 0") {{ placeholder || trans('nothingSelected') }}
			draggable-group.list-unstyled.m-0.d-flex(
				v-else-if="multiple"
				tag="ul"
				v-model="modelValueArray"
				:item-key="getModelItemKey"
			)
				template(#item="{ element, index }")
					li.ps-1.me-1.d-flex.bg-secondary.rounded(style="--bs-bg-opacity:0.25;cursor:move")
						.me-1 {{ getDisplayValue(element) }}
						!=' '
						button.btn-entity-item-remove.rounded(
							type="button"
							@click.prevent.stop="removeItem(index)"
						)
							i.fa-solid.fa-trash
			.ps-1.me-2.d-flex(v-else)
				span {{ getDisplayValue(modelValueArray[0]) }}
				button.btn-entity-item-remove.rounded.ms-2(
					type="button"
					@click.prevent.stop="removeItem(0)"
				)
					i.fa-solid.fa-trash
			span.dropdown-toggle
		.entity-select-dropdown.bg-light.rounded-bottom.pt-2(
			v-show="selecting"
			v-click-outside="selecting && !creating ? onClickOutsideSelector : null"
		)
			.p-2(v-if="allowCreate")
				button.btn.btn-primary.btn-sm(type="button" @click.prevent="creating = true") {{ trans('createEntityItem') }}
			.entity-select-dropdown-content
				keep-alive
					entity-view(
						v-if="selecting"
						no-actions
						selectable
						:entity-meta="relatedEntityMeta"
						:view="view"
						v-model:page="page"
						v-model:perPage="perPage"
						v-model:filters="filters"
						v-model:sort="sort"
						@item-click="toggleItem($event)"
					)
						template(#selection="data")
							label.d-block
								input.form-check-input(
									:type="multiple ? 'checkbox' : 'radio'"
									:checked="modelValueArray.includes(foreignKey ? data.item[foreignKey] : data.id)"
									@change="toggleItem(data)"
								)
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, ref, computed, reactive } from '@vue/runtime-core';
import DraggableGroup from 'vuedraggable';
import { get, useTemplate, useTranslator } from '../../vue-composition-utils';
import EntityView from '../entity-view.vue';
import EntityItem from '../entity-item.vue';
import ModalDialog from '../../modal/modal.vue';
import clickOutside from '../../click-outside';
import type { IRegisteredEntity } from '..';
import EntityManager from '..';

export default defineComponent({
	components: { EntityView, ModalDialog, EntityItem, DraggableGroup },
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
		entityMeta: {
			type: Object as PropType<IRegisteredEntity>,
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
		foreignKey: {
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
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { tpl } = useTemplate();
		const page = ref<number>(1);
		const perPage = ref<number | undefined>(undefined);
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
		const internalRelatedItems = reactive<Map<unknown, unknown>>(new Map());

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

		const addItem = (e: { id: string; item: Record<string, unknown> }) => {
			if (!props.multiple) {
				selecting.value = false;
			}
			creating.value = false;
			const item = props.foreignKey ? e.item[props.foreignKey] : e.id;
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
			perPage,
			filters,
			sort,
			selecting,
			creating,
			modelValueArray,
			onBlur(e: FocusEvent) {
				// hide selector if there is no focus within the element
				if (!(e.currentTarget as Node)?.contains(e.relatedTarget as Node)) {
					selecting.value = false;
				}
			},
			removeItem,
			addItem,
			toggleItem(e: { id: string; item: Record<string, unknown> }) {
				const index = modelValueArray.value.indexOf(props.foreignKey ? e.item[props.foreignKey] : e.id);
				if (index === -1) {
					addItem(e);
				} else {
					removeItem(index);
				}
			},
			onClickOutsideSelector() {
				selecting.value = false;
			},
			getDisplayValue(value: unknown) {
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
	cursor pointer
	font-size 0.875rem
	border 1px solid var(--bs-gray-400)
	border-radius 0.25rem
	&:hover, .form-field-entity-wrap.selecting &
		background-color var(--bs-light)
	.form-field-entity-wrap.selecting &
		border-bottom-left-radius 0
		border-bottom-right-radius 0
	.form-field-entity-wrap.has-errors &
		border-color var(--bs-danger)
.form-field-entity-wrap:focus-within .entity-selection
	border 1px solid #86b7fe
.entity-select-dropdown
	position absolute
	top 100%
	left 0
	right 0
	margin-top -1px
	min-width 280px
	z-index 5
	overflow hidden
	animation entity-dropdown-appear 0.1s ease-out
	border 1px solid #86b7fe
	border-top none
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
