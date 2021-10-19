import { inject } from 'vue';
import { injectKey } from 'mini-ioc-vue';
import type { AnyClass } from 'mini-ioc';
import type Container from 'mini-ioc';

export function getContainer(): Container {
	const injected = inject(injectKey) as Container;
	if (!injected) {
		throw new Error(`Inject IoC container: container is not provided by key ${String(injectKey)}`);
	}
	return injected;
}

export function get<T>(what: AnyClass<T>): T {
	return getContainer().get(what);
}

export function create<T>(what: AnyClass<T>): T {
	return getContainer().create(what);
}
