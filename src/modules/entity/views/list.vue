<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	ul.list-group.list-group-flush
		li.list-group-item.list-group-item-action.p-0(v-for="item in items")
			.d-flex.align-items-center
				.item-display.flex-grow-1.p-3(@click.prevent="onItemClick(item)")
					component(:is="displayComponent" v-bind="{ ...displayProps, item }")
				.pe-2
					slot(name="actions" :item="item")
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
	right @top
	bottom @top
	left @top
	opacity 0.8
	background white
	z-index 5
.item-display
	cursor pointer
</style>
