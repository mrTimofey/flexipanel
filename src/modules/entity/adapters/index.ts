import type { RealClass } from 'mini-ioc';
import type IAdapter from './adapter';

/**
 * Built-in API adapters map
 */
export default {
	jsonApi: () => import('./json-api').then((module) => module.default),
} as { [key: string]: () => Promise<RealClass<IAdapter>> };
