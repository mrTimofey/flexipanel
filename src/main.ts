import { createApp } from '@vue/runtime-dom';
import { createRouter, createWebHistory } from 'vue-router';
import Container from 'mini-ioc';
import { injectKey } from 'mini-ioc-vue';
import routes from './routes';
import App from './app.vue';
import HttpClient from './modules/http';
import FetchJsonClient from './modules/http/fetch-json-client';
import AuthProvider from './modules/auth/provider';
import PublicAuthProvider from './modules/auth/providers/public';

export interface IVueAdminConfig {
	lang: string;
}

export default class VueAdminApp {
	protected container = new Container();

	constructor() {
		// set default implementations
		this.container.bind(HttpClient, FetchJsonClient);
		this.container.bind(AuthProvider, PublicAuthProvider);
		// make container itself resolvable
		this.container.registerResolver(Container, () => this.container);
	}

	/**
	 * Returns IoC container. This is the entry point for anything you wish to customize.
	 * @returns container
	 */
	getIocContainer(): Container {
		return this.container;
	}

	/**
	 * Mount administration panel to a DOM element.
	 * @param target CSS selector or DOM element
	 * @returns this
	 */
	mount(target: string | Element): this {
		createApp(App)
			.use(
				createRouter({
					history: createWebHistory(import.meta.env.APP_ROUTES_BASE),
					routes,
				}),
			)
			.provide(injectKey, this.container)
			.mount(target);
		return this;
	}
}

export { PublicAuthProvider };

export { default as AppConfig } from './modules/app-config';
export { default as AuthProvider } from './modules/auth/provider';
export { default as HttpTokenAuthProvider } from './modules/auth/providers/http-token';
export { default as EntityManager } from './modules/entity';
export { default as JsonApiEntityApiAdapter } from './modules/entity/adapters/json-api';
export { default as HttpClient } from './modules/http';
export { default as FetchJsonHttpClient } from './modules/http/fetch-json-client';
export { default as Translator } from './modules/i18n';
export { default as KeyValueStorage } from './modules/key-value-storage';
export { default as TemplateEngine } from './modules/template';

export type { default as EntityApiAdapter } from './modules/entity/adapter';
