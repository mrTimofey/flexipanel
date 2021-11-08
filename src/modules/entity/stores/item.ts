import Container, { inject } from 'mini-ioc';
import type { IRegisteredEntity } from '..';
import ReactiveStore from '../../reactive-store';
import adapters from '../adapters';

export type DetailedItem = Record<string, unknown>;

export interface IState {
	loading: boolean;
	originalItem: DetailedItem;
	formItem: DetailedItem;
}

export default class EntityItemStore extends ReactiveStore<IState> {
	protected entity: IRegisteredEntity | null = null;
	private itemIdInternal = '';

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

	createBlankItem(): DetailedItem {
		if (!this.entity?.form.fields) {
			return {};
		}
		const item: DetailedItem = {};
		this.entity?.form.fields.forEach((field) => {
			item[field.key] = null;
		});
		return item;
	}

	async reloadOriginalItem(): Promise<void> {
		this.state.originalItem = {};
		if (!this.entity || !this.itemId) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = this.ioc.get(await adapters[this.entity.apiType]());
			this.state.originalItem = (await adapter.getItem(this.entity.apiEndpoint, { id: this.itemId })).item;
		} finally {
			this.state.loading = false;
		}
	}

	public async loadEntityItem(entity: IRegisteredEntity | null, id = ''): Promise<void> {
		if (this.entity === entity && this.itemId === id) {
			return;
		}
		this.entity = entity;
		this.itemIdInternal = id;
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

	public async save(): Promise<void> {
		if (!this.entity) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = this.ioc.get(await adapters[this.entity.apiType]());
			const { item } = await adapter.saveItem(this.entity.apiEndpoint, this.formItem, this.itemId);
			Object.assign(this.originalItem, item);
			Object.assign(this.formItem, item);
			this.itemIdInternal = `${item.id}`;
		} finally {
			this.state.loading = false;
		}
	}

	public async destroy(): Promise<void> {
		if (!this.entity) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = this.ioc.get(await adapters[this.entity.apiType]());
			await adapter.deleteItem(this.entity.apiEndpoint, this.itemId);
			this.state.originalItem = this.createBlankItem();
			this.state.formItem = this.createBlankItem();
		} finally {
			this.state.loading = false;
		}
	}

	get loading(): boolean {
		return this.state.loading;
	}

	get formItem(): DetailedItem {
		return this.state.formItem;
	}

	get originalItem(): DetailedItem {
		return this.state.originalItem;
	}

	get itemId(): string {
		return this.itemIdInternal;
	}
}
