export interface IListParams {
	offset: number;
	limit?: number;
}

export interface IListData {
	items: Record<string, unknown>[];
	offset: number;
	limit: number;
	total?: number;
}

export default interface IAdapter {
	getList(endpoint: string, params: IListParams): Promise<IListData>;
}
