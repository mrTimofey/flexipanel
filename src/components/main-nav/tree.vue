<template lang="pug">
.nav-item-list
	component(
		v-for="item in items"
		:is="item.children && item.children.length ? 'nav-group' : 'nav-item'"
		:to="item.to"
		:href="item.href"
		:active="isActive(item)"
	)
		template(#default) {{ item.title }}
		template(#before v-if="item.iconClass")
			nav-item-icon(:class="item.iconClass")
		template(#after v-if="item.badges?.length")
			nav-item-badge(
				v-for="badge in item.badges"
				:tooltip="badge.tooltip"
			) {{ badge.content }}
		template(#children)
			main-nav-tree(
				v-if="item.children && item.children.length"
				:items="item.children"
			)
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import NavGroup from './group.vue';
import NavItem from './item.vue';
import NavItemIcon from './item-icon.vue';
import NavItemBadge from './item-badge.vue';

import type { INavItem } from '../../modules/app-config';

export default defineComponent({
	name: 'MainNavTree',
	components: { NavGroup, NavItem, NavItemIcon, NavItemBadge },
	props: {
		items: {
			type: Array as PropType<INavItem[]>,
			required: true,
		},
	},
	setup() {
		const router = useRouter();
		const route = useRoute();

		return {
			isActive(item: INavItem) {
				return item.to ? router.resolve(item.to).path === route.path : route.path === item.href;
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.nav-item-list
	display grid
	gap 0.25rem
</style>
