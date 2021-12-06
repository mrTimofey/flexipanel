<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	table.table.table-hover.m-0
		colgroup
			col(v-if="selectable" style="width:0;white-space:nowrap")
			col(v-for="{ width } in columns" :style="{ width }")
			col(v-if="!noActions")
		thead(style="border-top:none")
			tr
				th(v-if="selectable")
				th(v-for="{ title } in columns") {{ title }}
				th(v-if="!noActions")
		tbody
			tr(v-for="item in items" :class="{ 'row-loading': loadingItems.has(item) }")
				td(v-if="selectable")
					slot(name="selection" :item="item")
				td.cell-display(
					v-for="col in columns"
					@click.prevent="col.type !== 'field' && onItemClick(item)"
					:class="{ 'p-1': col.type === 'field' }"
				)
					component(
						:is="displayComponent(col.type || defaultDisplayType)"
						v-bind="displayProps(item, col)"
						@input="onInput(item, $event)"
					)
				td.p-1(v-if="!noActions")
					slot(name="actions" :item="item")
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent } from '@vue/runtime-core';
import EntityManager from '..';
import { get } from '../../vue-composition-utils';

export interface IColumn {
	title: string;
	width?: string;
	type?: string;
	props?: Record<string, unknown>;
}

export default defineComponent({
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
	},
	emits: ['item-click', 'item-input'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		return {
			displayComponent(displayType: string) {
				return entityManager.getDisplayType(displayType)?.component;
			},
			displayProps(item: Record<string, unknown>, col: IColumn) {
				return { ...col, item, title: undefined, type: undefined };
			},
			onItemClick(item: unknown) {
				emit('item-click', item);
			},
			onInput(item: unknown, values: unknown) {
				emit('item-input', { item, values });
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
