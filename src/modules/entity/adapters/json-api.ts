import { inject } from 'mini-ioc';
import HttpClient from '../../http/http-client';
import type { IListParams, IListData } from './adapter';
import type IAdapter from './adapter';

interface IListItem {
	id: string;
	attributes: Record<string, unknown>;
}

interface IJsonApiListResponse {
	data: IListItem[];
}

export default class JsonApiAdapter implements IAdapter {
	constructor(protected http = inject(HttpClient)) {}

	async getList(endpoint: string, params: IListParams): Promise<IListData> {
		const rawData = await this.http.get<IJsonApiListResponse>(`${endpoint}?page[offset]=${params.offset}&page[limit]=${params.limit}`);
		return {
			items: rawData.data.map((item) => ({
				id: item.id,
				...item.attributes,
			})),
			offset: params.offset,
			limit: params.limit || rawData.data.length,
		};
	}
}
