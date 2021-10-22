import type { WritableComputedRef } from 'vue';
import { inject, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { injectKey } from 'mini-ioc-vue';
import type { AnyClass } from 'mini-ioc';
import type Container from 'mini-ioc';
import TemplateEngine from './template';

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

export function useRouteQueryParam<T>(key: string, defaultValue: T): WritableComputedRef<T> {
	const route = useRoute();
	const router = useRouter();
	const type = typeof defaultValue;
	return computed({
		get(): T {
			const value = route.query[key];
			if (value == null) {
				return defaultValue;
			}
			if (type === 'number') {
				return Number(value) as unknown as T;
			}
			if (type === 'string' || type === 'object') {
				return value.toString() as unknown as T;
			}
			if (type === 'boolean') {
				return (value === '1') as unknown as T;
			}
			return defaultValue;
		},
		set(value: T) {
			const query = { ...route.query };
			if (value === defaultValue) {
				delete query[key];
			} else {
				query[key] = `${value}`;
			}
			router.replace({ query });
		},
	});
}

export function useTemplate(): { tpl: (tpl: string, data?: unknown) => string } {
	const engine = get(TemplateEngine);
	return {
		tpl: (tpl, data) => engine.exec(tpl, data),
	};
}
