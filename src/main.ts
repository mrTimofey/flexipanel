import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Container from 'mini-ioc';
import { injectKey } from 'mini-ioc-vue';

import routes from './routes';
import App from './app.vue';
import HttpClient from './modules/http/http-client';
import FetchJsonClient from './modules/http/fetch-json-client';

import bootstrap from './bootstrap-demo';

const container = new Container();
container.bind(HttpClient, FetchJsonClient);

bootstrap(container);

createApp(App)
	.use(
		createRouter({
			history: createWebHistory(import.meta.env.APP_ROUTES_BASE),
			routes,
		}),
	)
	.provide(injectKey, container)
	.mount('#app');
