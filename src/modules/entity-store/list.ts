import { inject } from 'mini-ioc';
import type { IEntity } from '../entity-manager';
import HttpClient from '../http/http-client';
import ReactiveStore from '../reactive-store';

export interface IState<ListItem = Record<string, unknown>> {
	loading: boolean;
	list: ListItem[];
	total: number;
	perPage: number;
	offset: number;
}

export interface IApiOptions {
	page?: number;
}

export default class EntityListStore<ListItem = unknown> extends ReactiveStore<IState<ListItem>> {
	protected entity: IEntity | null = null;

	protected getInitialState(): IState<ListItem> {
		return {
			loading: false,
			list: [],
			total: -1,
			perPage: -1,
			offset: 0,
		};
	}

	constructor(protected httpClient = inject(HttpClient)) {
		super();
	}

	public async reload({ page = 1 }: IApiOptions = {}): Promise<void> {
		if (!this.entity?.api?.path) {
			return;
		}
		this.state.loading = true;
		await new Promise<void>((resolve) => {
			setTimeout(() => resolve(), 500);
		});
		try {
			const { data, per_page: perPage, page: currentPage, total } = await this.httpClient.get(`${this.entity.api.path}?page=${page}`);
			this.state.total = total;
			this.state.list = data;
			this.state.perPage = perPage;
			this.currentPage = currentPage;
		} finally {
			this.state.loading = false;
		}
	}

	public setEntity(entity: IEntity | null): void {
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

	get currentPage(): number {
		return Math.floor(this.state.offset / this.state.perPage) + 1;
	}

	set currentPage(page: number) {
		this.state.offset = this.state.perPage * (page - 1);
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
