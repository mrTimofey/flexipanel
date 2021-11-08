import Container, { inject } from 'mini-ioc';
import type { IRegisteredEntity } from '..';
import ReactiveStore from '../../reactive-store';
import adapters from '../adapters';

export interface IState {
	loading: boolean;
	originalItem: Record<string, unknown>;
	formItem: Record<string, unknown>;
}

export default class EntityItemStore extends ReactiveStore<IState> {
	protected entity: IRegisteredEntity | null = null;
	protected itemId = '';

	protected getInitialState(): IState {
		return {
			loading: false,
			originalItem: {},
			formItem: {},
		};
	}

	constructor(protected ioc = inject(Container)) {
		super();
	}

	createBlankItem(): Record<string, unknown> {
		return {};
	}

	async reloadOriginalItem(): Promise<void> {
		this.state.originalItem = {};
		if (!this.entity || !this.itemId) {
			return;
		}
		this.state.loading = true;
		const adapter = this.ioc.get(await adapters[this.entity.apiType]());
		this.state.originalItem = (await adapter.getItem(this.entity.apiEndpoint, { id: this.itemId })).item;
	}

	public async loadEntityItem(entity: IRegisteredEntity | null, id = ''): Promise<void> {
		if (this.entity === entity && this.itemId === id) {
			return;
		}
		this.entity = entity;
		this.itemId = id;
		this.resetState();
		if (!entity) {
			return;
		}
		if (id) {
			await this.reloadOriginalItem();
			this.state.formItem = { ...this.state.originalItem };
		} else {
			this.state.originalItem = this.createBlankItem();
			this.state.formItem = this.createBlankItem();
		}
	}
}
