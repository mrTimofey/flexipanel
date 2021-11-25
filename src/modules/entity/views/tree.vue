<template lang="pug">
.content(v-if="currentLevelItems.length" :class="{ loading, root: !parentId }")
	template(v-for="item in currentLevelItems")
		.tree-view-item-wrap
			.tree-view-item.d-flex.align-items-center.rounded.shadow-sm.border.border-light
				.ps-1(v-if="selectable")
					slot(name="selection" :item="item")
				.item-display.flex-grow-1.px-2.py-1(@click.prevent="onItemClick(item)")
					component(:is="displayComponent" v-bind="{ ...displayProps, item }")
				.p-1(v-if="!noActions")
					slot(name="actions" :item="item")
		tree-view.ps-4(
			v-bind="props"
			:parent-id="getParentId(item)"
			:loading="false"
			@item-click="onItemClick($event)"
		)
			template(
				v-for="(_, slot) of slots"
				#[slot]=`// @ts-ignore
							scope`
			)
				slot(:name="slot" v-bind="scope")
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed } from '@vue/runtime-core';
import EntityManager from '..';
import { get } from '../../vue-composition-utils';

function deep(obj: Record<string, unknown>, path: string[]): unknown {
	let current = obj;
	// eslint-disable-next-line no-restricted-syntax
	for (const prop of path) {
		current = current[prop] as Record<string, unknown>;
		if (current == null || typeof current !== 'object') {
			break;
		}
	}
	return current;
}

export default defineComponent({
	name: 'TreeView',
	props: {
		items: {
			type: Array as PropType<Record<string, unknown>[]>,
			required: true,
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
		itemKey: {
			type: String,
			default: 'id',
		},
		itemForeign: {
			type: [Array, String] as PropType<string | string[]>,
			default: 'parent.id',
		},
		parentId: {
			type: [String, Number] as PropType<string | number>,
			default: null,
		},
	},
	emits: ['item-click'],
	setup(props, { emit, slots }) {
		const entityManager = get(EntityManager);
		const foreignPath = computed<string[]>(() => (Array.isArray(props.itemForeign) ? props.itemForeign : props.itemForeign.split('.')));
		const currentLevelItems = computed(() =>
			props.parentId
				? // with parent
				  props.items.filter((item) => deep(item, foreignPath.value) === props.parentId)
				: // roots
				  props.items.filter((item) => !deep(item, foreignPath.value)),
		);
		return {
			slots,
			props,
			currentLevelItems,
			displayComponent: computed(() => entityManager.getDisplayType(props.displayType)?.component),
			onItemClick(item: unknown) {
				emit('item-click', item);
			},
			getParentId(item: Record<string, unknown>) {
				return item[props.itemKey] as string | number;
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.content
	position relative
.root
	padding 0 0.5rem
	&.loading::before
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
.tree-view-item-wrap
	margin-bottom 0.5rem
.tree-view-item
	background white
	position relative
	z-index 1
	cursor pointer
	&:hover
		background var(--bs-light)
.content:not(.root) > .tree-view-item-wrap
	position relative
	&:before
		content ''
		display block
		color var(--bs-gray-400)
		border-bottom 2px solid
		border-left 2px solid
		border-bottom-left-radius 0.25rem
		position absolute
		bottom 50%
		right 100%
		width 0.75rem
		height calc(100% + 0.75rem + 2px)
		margin-bottom -2px
		pointer-events none
</style>