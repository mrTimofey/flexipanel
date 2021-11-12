<template lang="pug">
.container-fluid.bg-light(v-if="auth.isAuthorized")
	.row
		aside.col.bg-white.shadow-sm
			.text-center.fs-5.fw-semibold.p-3.border-bottom
				router-link.text-decoration-none.link-dark(:to="appHomeLink") {{ appTitle }}
			.py-2.ps-3.pe-2.border-bottom
				.row.align-items-center
					.col
						.fw-bold {{ auth.userName || 'Admin' }}
					.col-auto.text-end
						button.btn.btn-sm.btn-primary(@click.prevent="auth.logout()" :title="trans('logout')")
							i.fa-solid.fa-right-from-bracket
			main-nav(:items="mainNavItems")
		main.col.p-3
			router-view
.auth-container.bg-dark.bg-gradient(v-else)
	.auth-form.bg-light.shadow-3.rounded
		.p-3.fs-5.fw-semibold.text-center.border-bottom {{ appTitle }}
		.p-4
			auth-form
notification-root
</template>

<script lang="ts">
import { defineComponent, watchEffect, computed } from '@vue/runtime-core';
import { useRouter } from 'vue-router';
import { get, useTranslator } from './modules/vue-composition-utils';
import AppConfig from './modules/app-config';
import MainNav from './components/main-nav/index.vue';
import AuthForm from './components/auth-form.vue';
import Meta from './modules/meta';
import AuthStore from './modules/auth/store';
import { NotificationRoot } from './modules/notification';

export default defineComponent({
	name: 'App',
	components: {
		MainNav,
		AuthForm,
		NotificationRoot,
	},
	setup() {
		const config = get(AppConfig);
		const meta = get(Meta);
		const auth = get(AuthStore);
		watchEffect(() => {
			config.applyToDom();
		});
		useRouter().beforeEach((to, from, next) => {
			meta.pageTitle = '';
			next();
		});
		auth.loadFromStorage();
		return {
			auth,
			appTitle: computed(() => config.appTitle),
			appHomeLink: computed(() => config.appHomeLink),
			mainNavItems: computed(() => config.mainNav),
			...useTranslator(),
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
.auth-container
	min-height 100vh
	padding 5rem
.auth-form
	max-width 380px
	margin 0 auto
</style>
