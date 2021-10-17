import HttpClient from './http-client';

export default class FetchJsonClient extends HttpClient {
	fetch<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
		return window
			.fetch(url, {
				method,
				body: body == null ? null : JSON.stringify(body),
			})
			.then((res) => res.json());
	}
}
