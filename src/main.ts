import { createApp } from 'vue';
import type { Router, RouteRecordRaw } from 'vue-router';
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
	protected router: Router = createRouter({
		history: createWebHistory(import.meta.env.APP_ROUTES_BASE),
		routes,
	});

	constructor() {
		// set default implementations
		this.container.bind(HttpClient, FetchJsonClient);
		this.container.bind(AuthProvider, PublicAuthProvider);
		// make container itself resolvable
		this.container.registerResolver(Container, () => this.container);
	}

	/**
	 * Add route to the app Vue router instance.
	 * @param route route definition
	 */
	addRoute(route: RouteRecordRaw): this {
		this.router.addRoute(route);
		return this;
	}

	/**
	 * Returns IoC container. This is the entry point for anything you wish to customize.
	 */
	getIocContainer(): Container {
		return this.container;
	}

	/**
	 * Mount administration panel to a DOM element.
	 * @param target CSS selector or DOM element
	 */
	mount(target: string | Element): this {
		createApp(App).use(this.router).provide(injectKey, this.container).mount(target);
		return this;
	}
}
