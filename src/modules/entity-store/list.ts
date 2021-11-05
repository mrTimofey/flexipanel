import Container, { inject } from 'mini-ioc';
import type { IRegisteredEntity } from '../entity';
import HttpClient from '../http/http-client';
import ReactiveStore from '../reactive-store';
import adapters from '../entity/adapters';

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

export default class EntityListStore extends ReactiveStore<IState> {
	protected entity: IRegisteredEntity | null = null;

	protected getInitialState(): IState {
		return {
			loading: false,
			list: [],
			total: -1,
			perPage: 0,
			offset: 0,
			page: 1,
		};
	}

	constructor(protected httpClient = inject(HttpClient), protected ioc = inject(Container)) {
		super();
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
			const adapter = this.ioc.get(await adapters[this.entity.apiType as string]());
			const res = await adapter.getList(this.entity.apiEndpoint, {
				offset: perPage ? perPage * (page - 1) : 0,
				limit: perPage,
			});
			this.state.list = res.items;
			this.state.offset = res.offset;
			this.state.perPage = res.limit;
			this.state.page = Math.ceil(this.state.offset / this.state.perPage) + 1;
			this.state.total = res.total || this.state.list.length;
		} finally {
			this.state.loading = false;
		}
	}

	public async deleteItem(item: ListItem): Promise<void> {
		if (!this.entity) {
			return;
		}
		const itemKey = (item as unknown as Record<string, string>)[this.entity.itemUrlKey as string];
		if (!itemKey) {
			return;
		}
		this.state.loading = true;
		try {
			await this.httpClient.delete(`${this.entity.apiEndpoint}/${itemKey}`);
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
			adapters[entity.apiType as string]();
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
		return Math.ceil(this.state.total / this.state.perPage);
	}

	get perPage(): number {
		return this.state.perPage;
	}

	get offset(): number {
		return this.state.offset;
	}
}
