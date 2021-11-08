import type { IHttpRequest, IHttpResponse } from '.';
import HttpClient from '.';

export default class FetchJsonClient extends HttpClient {
	sendRequest<T>({ url, method, body: reqBody, headers }: IHttpRequest): Promise<IHttpResponse<T>> {
		return window
			.fetch(url, {
				method,
				body: reqBody == null ? null : JSON.stringify(reqBody),
				headers: {
					'Content-Type': 'application/json',
					...headers,
				},
			})
			.then((res) => {
				const contentType = res.headers.get('Content-Type');
				if (contentType && contentType.startsWith('application') && contentType.includes('json')) {
					return res.json().then((body) => ({
						headers: res.headers,
						status: res.status,
						statusText: res.statusText,
						body,
					}));
				}
				throw new Error('Response body should be in JSON format');
			});
	}
}
