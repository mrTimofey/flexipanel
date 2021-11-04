import { createApp } from '@vue/runtime-dom';
import { createRouter, createWebHistory } from 'vue-router';
import Container from 'mini-ioc';
import { injectKey } from 'mini-ioc-vue';
import routes from './routes';
import App from './app.vue';
import HttpClient from './modules/http/http-client';
import FetchJsonClient from './modules/http/fetch-json-client';
import AuthProvider from './modules/auth/provider';
import PublicAuthProvider from './modules/auth/providers/public';

import { bootApp } from './app';

const container = new Container();
container.bind(HttpClient, FetchJsonClient);
container.bind(AuthProvider, PublicAuthProvider);
container.registerResolver(Container, () => container);

bootApp(container);

createApp(App)
	.use(
		createRouter({
			history: createWebHistory(import.meta.env.APP_ROUTES_BASE),
			routes,
		}),
	)
	.provide(injectKey, container)
	.mount('#app');
