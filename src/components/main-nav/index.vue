<template lang="pug">
.main-nav.p-2
	nav-item-list(:items="items")
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import NavItemList from './tree.vue';
import type { INavItem } from '../../modules/app-config';

export default defineComponent({
	name: 'MainNav',
	components: { NavItemList },
	props: {
		items: {
			type: Array as PropType<INavItem[]>,
			required: true,
		},
	},
});
</script>
