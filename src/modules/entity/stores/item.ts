import type { IRegisteredEntity } from '..';
import EntityBaseStore from './base';

export type DetailedItem = Record<string, unknown>;

export interface IState {
	loading: boolean;
	originalItem: DetailedItem;
	formItem: DetailedItem;
	relatedItems: Record<string, Record<string, Record<string, unknown>>>;
}

export default class EntityItemStore extends EntityBaseStore<IState> {
	protected entity: IRegisteredEntity | null = null;
	private itemIdInternal = '';

	protected getInitialState(): IState {
		return {
			loading: false,
			originalItem: {},
			formItem: {},
			relatedItems: {},
		};
	}

	protected createItem(values: Record<string, unknown> = {}): DetailedItem {
		if (!this.entity?.form.fields) {
			return {};
		}
		const item: DetailedItem = {};
		this.entity?.form.fields.forEach((field) => {
			item[field.key] = Object.prototype.hasOwnProperty.call(values, field.key) ? values[field.key] : null;
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
			const adapter = await this.getAdapter();
			const { item, relatedItems } = await adapter.getItem(this.entity.apiEndpoint, { id: this.itemId });
			this.state.originalItem = item;
			this.state.relatedItems = relatedItems;
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
			this.state.originalItem = this.createItem();
			this.state.formItem = this.createItem();
		}
	}

	public async save(): Promise<void> {
		if (!this.entity) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = await this.getAdapter();
			const { item, relatedItems } = await adapter.saveItem(this.entity.apiEndpoint, this.createItem(this.formItem), this.itemId);
			Object.assign(this.originalItem, item);
			Object.assign(this.formItem, item);
			this.state.relatedItems = relatedItems;
			this.itemIdInternal = `${item[this.entity.itemUrlKey]}`;
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
			const adapter = await this.getAdapter();
			await adapter.deleteItem(this.entity.apiEndpoint, this.itemId);
			this.state.originalItem = this.createItem();
			this.state.formItem = this.createItem();
		} finally {
			this.state.loading = false;
		}
	}

	get loading(): IState['loading'] {
		return this.state.loading;
	}

	get formItem(): IState['formItem'] {
		return this.state.formItem;
	}

	get originalItem(): IState['originalItem'] {
		return this.state.originalItem;
	}

	get relatedItems(): IState['relatedItems'] {
		return this.state.relatedItems;
	}

	get itemId(): string {
		return this.itemIdInternal;
	}
}
