<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	table.table.table-hover.m-0
		thead
			tr
				th(v-for="{ title } in columns") {{ title }}
				th(v-if="!noActions")
		tbody
			tr(v-for="item in items")
				td.cell-display(v-for="field in columns" @click.prevent="onItemClick(item)")
					component(
						:is="resolveDisplay(field.type || defaultDisplayType)"
						v-bind="displayProps(item, field)"
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
	type?: string;
	[displayProp: string]: unknown;
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
	},
	emits: ['item-click'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		return {
			resolveDisplay(displayType: string) {
				return entityManager.getDisplayType(displayType)?.component;
			},
			displayProps(item: Record<string, unknown>, field: IColumn) {
				return { ...field, item, title: undefined, type: undefined };
			},
			onItemClick(item: unknown) {
				emit('item-click', item);
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
	top -0.5rem
	right 0
	bottom @top
	left @right
	opacity 0.8
	background white
	z-index 5
.cell-display
	cursor pointer
</style>
