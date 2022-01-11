import Container, { inject } from 'mini-ioc';
import type { IRegisteredEntity } from '..';
import ReactiveStore from '../../reactive-store';
import type IAdapter from '../adapter';
import adapters from '../adapters';

export type ListItem = Record<string, unknown>;

export interface IState {
	loading: boolean;
	list: ListItem[];
	total: number;
	perPage: number;
	offset: number;
	page: number;
}

export interface IApiOptions {
	page?: number;
	perPage?: number;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export default abstract class EntityBaseStore<T extends object> extends ReactiveStore<T> {
	protected entity: IRegisteredEntity | null = null;

	constructor(protected ioc = inject(Container)) {
		super();
	}

	protected async getAdapter(): Promise<IAdapter> {
		if (!this.entity) {
			throw new Error('Entity not set');
		}
		if (!adapters[this.entity.apiType]) {
			throw new Error(`Entity adapter '${this.entity.apiType}' is not registered`);
		}
		return this.ioc.get(await adapters[this.entity.apiType]());
	}

	get entityMeta() {
		return this.entity;
	}

	get abilities(): Record<string, boolean> {
		// TODO abilities
		return {
			create: !!this.entity?.form.fields.length && !this.entity.createDisabled,
			edit: !!this.entity?.form.fields.length,
			delete: !!this.entity && !this.entity.deleteDisabled,
		};
	}
}
