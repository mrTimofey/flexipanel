<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	ul(:class="listClass")
		li(v-for="(item, index) in items" :class="itemClass")
			slot(name="item-before" :item="item")
			.d-flex.align-items-center
				.ps-2(v-if="selectable")
					slot(name="selection" :item="item")
				.item-display.flex-grow-1.p-2(@click.prevent="onItemClick(item)")
					slot(name="view-display" v-bind="{ item, displayType, displayProps }")
						component(:is="displayComponent" v-bind="{ ...displayProps, item, index }")
				.pe-2(v-if="!noActions")
					slot(name="actions" :item="item")
			slot(name="item-after" :item="item")
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed } from 'vue';
import EntityManager from '..';
import { get } from '../../vue-composition-utils';

export interface IColumn {
	title: string;
	key: string;
}

export default defineComponent({
	name: 'ListView',
	props: {
		items: {
			type: Array as PropType<Record<string, unknown>[]>,
			required: true,
		},
		listClass: {
			type: String,
			default: 'list-group list-group-flush',
		},
		itemClass: {
			type: String,
			default: 'list-group-item list-group-item-action p-0',
		},
		loading: {
			type: Boolean,
			default: false,
		},
		displayType: {
			type: String,
			default: 'text',
		},
		displayProps: {
			type: Object,
			default: null,
		},
		noActions: {
			type: Boolean,
			default: false,
		},
		selectable: {
			type: Boolean,
			default: false,
		},
		context: {
			type: Object,
			default: null,
		},
	},
	emits: ['item-click'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		return {
			displayComponent: computed(() => entityManager.getDisplayType(props.displayType)?.component),
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
.item-display
	cursor pointer
</style>
