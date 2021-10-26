import { inject } from 'mini-ioc';
import type { IEntityMeta } from '../entity';
import HttpClient from '../http/http-client';
import ReactiveStore from '../reactive-store';

export interface IState<ListItem = Record<string, unknown>> {
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

export default class EntityListStore<ListItem = Record<string, unknown>> extends ReactiveStore<IState<ListItem>> {
	protected entity: IEntityMeta | null = null;

	protected getInitialState(): IState<ListItem> {
		return {
			loading: false,
			list: [],
			total: -1,
			perPage: 0,
			offset: 0,
			page: 1,
		};
	}

	constructor(protected httpClient = inject(HttpClient)) {
		super();
	}

	public async reload({ page = 1, perPage }: IApiOptions = {}): Promise<void> {
		if (!this.entity?.apiEndpoint) {
			return;
		}
		this.state.loading = true;
		this.state.page = page;
		if (perPage) {
			this.state.perPage = perPage;
		}
		try {
			// TODO other providers (only rest is supported now)
			const { data, per_page: apiPerPage, page: currentPage, total } = await this.httpClient.get(`${this.entity.apiEndpoint}?page=${page}&per_page=${perPage}`);
			this.state.total = total;
			this.state.list = data;
			this.state.perPage = apiPerPage;
			this.state.page = currentPage;
			this.state.offset = apiPerPage * (currentPage - 1);
		} finally {
			this.state.loading = false;
		}
	}

	public async deleteItem(item: ListItem): Promise<void> {
		if (!this.entity?.apiEndpoint) {
			return;
		}
		const itemKey = (item as unknown as Record<string, string>)[this.entity.idKey];
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

	public setEntity(entity: IEntityMeta | null): void {
		if (this.entity === entity) {
			return;
		}
		this.entity = entity;
		this.resetState();
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
