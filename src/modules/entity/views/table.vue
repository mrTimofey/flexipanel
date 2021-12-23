<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	table.table.table-hover.m-0
		colgroup
			col(v-if="sortable" style="width:0;white-space:nowrap")
			col(v-if="selectable" style="width:0;white-space:nowrap")
			col(v-for="col in visibleColumns" :style="{ width: col.width }")
			col(v-if="!noActions")
		thead(style="border-top:none")
			tr
				th(v-if="sortable")
				th(v-if="selectable")
				th(v-for="{ title } in visibleColumns") {{ title }}
				th(v-if="!noActions")
		draggable-group.form-field-array-items(
			handle="[data-move-handle]"
			tag="tbody"
			:item-key="itemKey"
			:animation="200"
			:model-value="items"
			:disabled="!sortable"
			@change="$event.moved && onPositionChange($event.moved.oldIndex, $event.moved.newIndex)"
		)
			template(#item="{ element: item, index }")
				tr(:class="{ 'row-loading': loadingItems.has(item) }")
					td.bg-light(v-if="sortable" data-move-handle style="cursor:pointer")
						.px-2
							i.fa-solid.fa-arrows-alt-v
					td(v-if="selectable")
						slot(name="selection" :item="item")
					td.cell-display(
						v-for="col in visibleColumns"
						@click.prevent="col.type !== 'field' && onItemClick(item)"
						:class="{ 'p-1': col.type === 'field' }"
					)
						slot(name="view-display" v-bind="{ item, col }")
							component(
								:is="displayComponent(col.type || defaultDisplayType)"
								v-bind="displayProps(item, index, col)"
								@input="onInput(item, $event)"
							)
					td.p-1(v-if="!noActions")
						slot(name="actions" :item="item")
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import DraggableGroup from 'vuedraggable';
import EntityManager from '..';
import { get } from '../../vue-composition-utils';

export interface IColumn extends Record<string, unknown> {
	title: string;
	width?: string;
	type?: string;
}

export default defineComponent({
	name: 'TableView',
	components: { DraggableGroup },
	props: {
		items: {
			type: Array as PropType<Record<string, unknown>[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		loadingItems: {
			type: Object as PropType<Set<unknown>>,
			default: () => new Set(),
		},
		columns: {
			type: Array as PropType<IColumn[]>,
			required: true,
		},
		hiddenColumns: {
			type: Set as PropType<Set<IColumn>>,
			default: () => new Set(),
		},
		defaultDisplayType: {
			type: String,
			default: 'text',
		},
		noActions: {
			type: Boolean,
			default: false,
		},
		selectable: {
			type: Boolean,
			default: false,
		},
		sortable: {
			type: Boolean,
			default: false,
		},
		itemKey: {
			type: String,
			default: 'id',
		},
		context: {
			type: Object,
			default: null,
		},
	},
	emits: ['item-click', 'item-input', 'item-action-click'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		return {
			visibleColumns: computed(() => (props.hiddenColumns.size > 0 ? props.columns.filter((col) => !props.hiddenColumns.has(col)) : props.columns)),
			displayComponent(displayType: string) {
				return entityManager.getDisplayType(displayType)?.component;
			},
			displayProps(item: Record<string, unknown>, index: number, col: IColumn) {
				return { ...col, item, index, title: undefined, type: undefined, context: props.context };
			},
			onItemClick(item: unknown) {
				emit('item-click', item);
			},
			onInput(item: unknown, values: unknown) {
				emit('item-input', { item, values });
			},
			onPositionChange(oldIndex: number, newIndex: number) {
				emit('item-action-click', {
					action: 'itemPositionChange',
					oldIndex,
					newIndex,
				});
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.content
	position relative
.loading::before
	content ''
	display block
	position absolute
	top 0
	right 0
	bottom @top
	left @right
	opacity 0.8
	background white
	z-index 5
.cell-display
	cursor pointer
.row-loading
	opacity 0.2
</style>
