import { inject } from 'mini-ioc';
import HttpClient from '../../http';
import type { IListParams, IListData, IItemParams, IItemData } from '../adapter';
import type IAdapter from '../adapter';

interface IJsonApiListResponse {
	data: IJsonApiItem[];
}

interface IJsonApiRelationship {
	data: { id: string } | { id: string }[];
}

interface IJsonApiItem {
	id: string;
	attributes: Record<string, unknown>;
	relationships?: Record<string, IJsonApiRelationship>;
}

interface IJsonApiItemResponse {
	data: IJsonApiItem;
}

function adaptItemResponse({ data }: IJsonApiItemResponse): IItemData {
	const adapted: IItemData = { item: { id: data.id, ...data.attributes } };
	if (data.relationships) {
		Object.entries(data.relationships).forEach(([key, value]) => {
			adapted.item[key] = Array.isArray(value.data)
				? // array of related items
				  value.data.map(({ id }) => id)
				: // single related item
				  value.data?.id || null;
		});
	}
	return adapted;
}

export default class JsonApiAdapter implements IAdapter {
	constructor(protected http = inject(HttpClient)) {}

	async getList(endpoint: string, params: IListParams): Promise<IListData> {
		const urlParams: [string, string][] = [];
		if (params.offset) {
			urlParams.push(['page[offset]', params.offset.toString()]);
		}
		if (params.limit) {
			urlParams.push(['page[limit]', params.limit.toString()]);
		}
		if (params.filters) {
			Object.entries(params.filters).forEach(([key, value]) => {
				urlParams.push([`filter[${key}]`, `${value}`]);
			});
		}
		const urlParamsString = `?${urlParams.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
		const { body } = await this.http.get<IJsonApiListResponse>(`${endpoint}${urlParamsString.length > 1 ? urlParamsString : ''}`, {
			'Content-Type': 'application/vnd.api+json',
		});
		return {
			items: body.data.map((item) => ({
				id: item.id,
				...item.attributes,
			})),
			// TODO pagination
		};
	}

	async getItem(endpoint: string, { id }: IItemParams): Promise<IItemData> {
		const { body } = await this.http.get<IJsonApiItemResponse>(`${endpoint}/${id}`, {
			'Content-Type': 'application/vnd.api+json',
		});
		return adaptItemResponse(body);
	}

	async deleteItem(endpoint: string, id: string): Promise<void> {
		await this.http.delete(`${endpoint}/${id}`, null, {
			'Content-Type': 'application/vnd.api+json',
		});
	}

	async saveItem(endpoint: string, item: Record<string, unknown>, id?: string): Promise<IItemData> {
		const attributes = { ...item };
		delete attributes.id;
		const { body } = await this.http.fetch<IJsonApiItemResponse>(
			id ? `${endpoint}/${id}` : endpoint,
			id ? 'PATCH' : 'POST',
			{ data: { attributes } },
			{
				'Content-Type': 'application/vnd.api+json',
			},
		);
		return adaptItemResponse(body);
	}
}
