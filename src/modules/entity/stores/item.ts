import type { IField, IRegisteredEntity } from '..';
import { ValidationError } from '../adapter';
import EntityBaseStore from './base';

export type DetailedItem = Record<string, unknown>;

export interface IState {
	loading: boolean;
	originalItem: DetailedItem;
	formItem: DetailedItem;
	relatedItems: Record<string, Record<string, Record<string, unknown>>>;
	formErrors: Record<string, string[]>;
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
			formErrors: {},
		};
	}

	protected get keyedFormFields(): Required<IField>[] {
		if (!this.entity?.form.fields) {
			return [];
		}
		return this.entity.form.fields.filter((field) => !!field.key) as Required<IField>[];
	}

	protected createItem(values: Record<string, unknown> = {}): DetailedItem {
		if (!this.entity?.form.fields) {
			return {};
		}
		const item: DetailedItem = {};
		this.keyedFormFields.forEach((field) => {
			if (Object.prototype.hasOwnProperty.call(values, field.key)) {
				item[field.key] = values[field.key];
			} else if (field.default !== undefined) {
				item[field.key] = field.default;
			} else {
				item[field.key] = null;
			}
		});
		return item;
	}

	protected inlineRelatedItems(item: Record<string, unknown>): void {
		if (!this.entity?.form.fields) {
			return;
		}
		this.keyedFormFields
			.filter(({ inlineRelated }) => inlineRelated)
			.forEach((field) => {
				const value = item[field.key];
				if (Array.isArray(value)) {
					item[field.key] = value.map((id) => this.relatedItems[field.key][id]);
				} else {
					item[field.key] = this.relatedItems[field.key][`${value}`];
				}
			});
	}

	public async reloadOriginalItem(): Promise<void> {
		this.state.originalItem = {};
		if (!this.entity || !this.itemId) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = await this.getAdapter();
			const { item, relatedItems } = await adapter.getItem(this.entity.apiEndpoint, { id: this.itemId });
			this.state.relatedItems = relatedItems;
			this.inlineRelatedItems(item);
			this.state.originalItem = item;
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
		this.state.formErrors = {};
		if (!this.entity) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = await this.getAdapter();
			const { item, relatedItems } = await adapter.saveItem(this.entity.apiEndpoint, this.createItem(this.formItem), this.itemId);
			this.state.relatedItems = relatedItems;
			this.inlineRelatedItems(item);
			Object.assign(this.originalItem, item);
			Object.assign(this.formItem, item);
			this.itemIdInternal = `${item[this.entity.itemUrlKey]}`;
		} catch (err) {
			if (err instanceof ValidationError) {
				this.state.formErrors = err.fieldErrors;
			}
			throw err;
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

	public async updateFormFieldValue(key: string, value: unknown, immediate = false) {
		this.formItem[key] = value;
		if (immediate && this.entity) {
			const adapter = await this.getAdapter();
			adapter.saveItem(this.entity.apiEndpoint, { [key]: value }, this.itemId);
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

	get formErrors(): IState['formErrors'] {
		return this.state.formErrors;
	}

	get itemId(): string {
		return this.itemIdInternal;
	}

	get hasErrors(): boolean {
		return Object.keys(this.formErrors).length > 0;
	}
}
