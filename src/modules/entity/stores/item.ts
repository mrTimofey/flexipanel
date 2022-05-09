import type { IField, IRegisteredEntity } from '..';
import { ValidationError } from '../adapter';
import EntityBaseStore from './base';

export type DetailedItem = Record<string, unknown>;

export interface IState {
	loading: boolean;
	dirty: boolean;
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
			dirty: false,
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
			} else if ((field.updateOnly && this.itemId) || (field.createOnly && !this.itemId)) {
				item[field.key] = null;
			}
		});
		return item;
	}

	protected inlineRelatedItems(item: Record<string, unknown>, fields?: string[]): void {
		if (!this.entity?.form.inlineRelated?.length) {
			return;
		}
		const relatedFields = fields || this.entity.form.inlineRelated;
		// go through each inlining field
		for (const fieldName of relatedFields) {
			// the field can be declared with a nested subfields do split it
			const parts = fieldName.split('.');
			let obj: unknown = item;
			let relatedKey = '';
			// go through tje field itself and its nested subfields
			for (const part of parts) {
				relatedKey += part;
				// fill object or array of objects with related items
				for (const objItem of Array.isArray(obj) ? obj : [obj]) {
					const value = objItem?.[part];
					if (Array.isArray(value)) {
						// eslint-disable-next-line no-loop-func
						objItem[part] = value.map((id) => this.relatedItems[relatedKey][id]);
					} else if (value != null) {
						objItem[part] = this.relatedItems[relatedKey][`${value}`];
					}
				}
				obj = item?.[part];
				relatedKey += '.';
			}
		}
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
			this.state.dirty = false;
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
		this.state.dirty = true;
		if (immediate && this.entity) {
			const adapter = await this.getAdapter();
			adapter.saveItem(this.entity.apiEndpoint, { [key]: value }, this.itemId);
			this.state.dirty = false;
		}
	}

	public setRelatedItem(key: string, id: string, item: Record<string, unknown>) {
		if (!this.relatedItems[key]) {
			this.relatedItems[key] = {};
		}
		this.relatedItems[key][id] = item;
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

	get isDirty(): boolean {
		return this.state.dirty;
	}
}
