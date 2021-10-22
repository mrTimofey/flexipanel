<template lang="pug">
.container-fluid
	.row
		aside.col.bg-light
			.text-center.fs-5.fw-semibold.p-3.border-bottom
				router-link.text-decoration-none.link-dark(:to="appHomeLink") {{ appTitle }}
			main-nav(:items="mainNavItems")
		main.col.p-4
			router-view
</template>

<script lang="ts">
import { defineComponent, watchEffect, computed, onBeforeMount } from 'vue';
import { get } from './modules/vue-composition-utils';
import AppConfig from './modules/app-config';
import MainNav from './components/main-nav/index.vue';
import Meta from './modules/meta';

export default defineComponent({
	name: 'App',
	components: {
		MainNav,
	},
	setup() {
		const config = get(AppConfig);
		const meta = get(Meta);
		watchEffect(() => {
			config.applyToDom();
		});
		onBeforeMount(() => {
			meta.pageTitle = config.appTitle;
		});
		return {
			appTitle: computed(() => config.appTitle),
			appHomeLink: computed(() => config.appHomeLink),
			mainNavItems: computed(() => config.mainNav),
		};
	},
});
</script>

<style lang="stylus" scoped>
aside
	min-height 100vh
	width 260px
	flex none
	padding 0
</style>
