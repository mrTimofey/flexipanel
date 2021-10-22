<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	ul.list-group
		li.list-group-item(v-for="item in items")
			component(:is="displayComponent" v-bind="{ ...displayProps, item }")
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
	setup(props) {
		const entityManager = get(EntityManager);
		return {
			displayComponent: computed(() => entityManager.getDisplayType(props.displayType)?.component),
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
</style>
