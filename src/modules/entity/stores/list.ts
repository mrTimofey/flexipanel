import type { IRegisteredEntity } from '..';
import adapters from '../adapters';
import EntityBaseStore from './base';

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

export default class EntityListStore extends EntityBaseStore<IState> {
	protected entity: IRegisteredEntity | null = null;

	protected getInitialState(): IState {
		return {
			loading: false,
			list: [],
			total: -1,
			perPage: 0,
			offset: -1,
			page: 1,
		};
	}

	public async reload({ page = 1, perPage }: IApiOptions = {}): Promise<void> {
		if (!this.entity) {
			return;
		}
		this.state.loading = true;
		this.state.page = page;
		if (perPage) {
			this.state.perPage = perPage;
		}
		try {
			const adapter = await this.getAdapter();
			const res = await adapter.getList(this.entity.apiEndpoint, {
				offset: perPage ? perPage * (page - 1) : 0,
				limit: perPage,
			});
			this.state.list = res.items;
			this.state.offset = res.offset || -1;
			this.state.perPage = res.limit || 0;
			this.state.page = this.state.perPage > 0 ? Math.ceil(this.state.offset / this.state.perPage) + 1 : 1;
			this.state.total = res.total || this.state.list.length;
		} finally {
			this.state.loading = false;
		}
	}

	public async deleteItem(item: ListItem): Promise<void> {
		if (!this.entity) {
			return;
		}
		const itemKey = (item as unknown as Record<string, string>)[this.entity.itemUrlKey];
		if (!itemKey) {
			return;
		}
		this.state.loading = true;
		try {
			const adapter = await this.getAdapter();
			await adapter.deleteItem(this.entity.apiEndpoint, itemKey);
		} finally {
			this.state.loading = false;
		}
	}

	public setEntity(entity: IRegisteredEntity | null): void {
		if (this.entity === entity) {
			return;
		}
		this.entity = entity;
		this.resetState();
		if (entity) {
			adapters[entity.apiType]();
		}
	}

	get loading(): boolean {
		return this.state.loading;
	}

	get total(): number {
		return this.state.total;
	}

	get items(): ListItem[] {
		return this.state.list;
	}

	get page(): number {
		return this.state.page;
	}

	get lastPage(): number {
		return this.state.perPage > 0 ? Math.ceil(this.state.total / this.state.perPage) : 1;
	}

	get perPage(): number {
		return this.state.perPage;
	}

	get offset(): number {
		return this.state.offset;
	}

	get hasPagination(): boolean {
		return this.state.perPage > 0;
	}
}
