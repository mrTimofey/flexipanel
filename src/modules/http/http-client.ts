/* eslint-disable max-classes-per-file */
export interface IHttpRequest {
	url: string;
	method: string;
	body: unknown;
	headers: Record<string, string>;
}

export interface IHttpResponse<T = unknown> {
	body: T;
	headers: {
		get(key: string): string | null;
		has(key: string): boolean;
	};
	status: number;
	statusText: string;
}

export class HttpRequestError<T> extends Error {
	constructor(public req: IHttpRequest, public res: IHttpResponse<T> | null) {
		super('HTTP request error');
	}
}

export type RequestInterceptor = (req: IHttpRequest) => void;
export type ErrorHandler = <T>(req: HttpRequestError<T>) => Promise<IHttpResponse<T> | null>;

function collection<T>() {
	const items = [] as T[];
	return {
		items,
		add(item: T) {
			items.push(item);
		},
		remove(item: T) {
			const index = items.indexOf(item);
			if (index === -1) {
				return;
			}
			items.splice(index, 1);
		},
	};
}

export default abstract class HttpClient {
	protected requestInterceptors = collection<RequestInterceptor>();
	protected errorHandlers = collection<ErrorHandler>();

	protected abstract sendRequest<T>(req: IHttpRequest): Promise<IHttpResponse<T>>;

	private async handleError<T>(err: HttpRequestError<T>): Promise<IHttpResponse<T>> {
		const next = async (i = 0): Promise<IHttpResponse<T> | null> => {
			if (!this.errorHandlers.items[i]) {
				return null;
			}
			const res = await this.errorHandlers.items[i](err);
			if (res) {
				return res;
			}
			return next(i + 1);
		};
		const fallbackRes = await next();
		if (fallbackRes) {
			return fallbackRes;
		}
		if (err.res) {
			return err.res;
		}
		throw err;
	}

	async fetch<T>(url: string, method: string, body?: unknown, headers?: Record<string, string>): Promise<IHttpResponse<T>> {
		const req: IHttpRequest = { url, method, body, headers: headers || {} };
		this.requestInterceptors.items.forEach((fn) => fn(req));
		try {
			const res = await this.sendRequest<T>(req);
			if (res.status >= 400 && res.status < 600) {
				throw new HttpRequestError(req, res);
			}
			return res;
		} catch (err) {
			if (err instanceof HttpRequestError) {
				return this.handleError(err);
			}
			throw err;
		}
	}

	addRequestInterceptor(fn: RequestInterceptor): this {
		this.requestInterceptors.add(fn);
		return this;
	}

	removeRequestInterceptor(fn: RequestInterceptor): this {
		this.requestInterceptors.remove(fn);
		return this;
	}

	addErrorHandler(fn: ErrorHandler): this {
		this.errorHandlers.add(fn);
		return this;
	}

	removeErrorHandler(fn: ErrorHandler): this {
		this.errorHandlers.remove(fn);
		return this;
	}

	get<T>(url: string, headers?: Record<string, string>): Promise<IHttpResponse<T>> {
		return this.fetch(url, 'GET', undefined, headers);
	}

	post<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<IHttpResponse<T>> {
		return this.fetch(url, 'POST', body, headers);
	}

	put<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<IHttpResponse<T>> {
		return this.fetch(url, 'PUT', body, headers);
	}

	patch<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<IHttpResponse<T>> {
		return this.fetch(url, 'PATCH', body, headers);
	}

	delete<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<IHttpResponse<T>> {
		return this.fetch(url, 'DELETE', body, headers);
	}
}
