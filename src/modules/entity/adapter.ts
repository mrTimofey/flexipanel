export interface IListParams {
	offset: number;
	limit?: number;
}

export interface IListData {
	items: Record<string, unknown>[];
	offset?: number;
	limit?: number;
	total?: number;
}

export interface IItemParams {
	id: string;
}

export interface IItemData {
	item: Record<string, unknown>;
}

export default interface IAdapter {
	getList(endpoint: string, params: IListParams): Promise<IListData>;
	getItem(endpoint: string, params: IItemParams): Promise<IItemData>;
	deleteItem(endpoint: string, id: string): Promise<void>;
	saveItem(endpoint: string, item: Record<string, unknown>, id?: string): Promise<IItemData>;
}
