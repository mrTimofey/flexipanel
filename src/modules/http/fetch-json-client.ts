import type { IHttpRequest, IHttpResponse, IUploadRequest } from '.';
import HttpClient from '.';

export default class FetchJsonClient extends HttpClient {
	protected sendRequest<T>({ url, method, body: reqBody, headers }: IHttpRequest): Promise<IHttpResponse<T>> {
		return window
			.fetch(url, {
				method,
				body: reqBody == null ? null : JSON.stringify(reqBody),
				headers: {
					// eslint-disable-next-line @typescript-eslint/naming-convention
					'Content-Type': 'application/json',
					...headers,
				},
				credentials: 'include',
			})
			.then(async (res) => {
				const contentType = res.headers.get('Content-Type');
				let body = null;
				if (contentType && contentType.startsWith('application') && contentType.includes('json')) {
					body = await res.json();
				}
				return {
					headers: res.headers,
					status: res.status,
					statusText: res.statusText,
					body,
				};
			});
	}

	protected sendFile<T>({ body: blob, onProgress, method, url, headers }: IUploadRequest<Blob>): Promise<IHttpResponse<T>> {
		return new Promise((resolve, reject) => {
			const body = new FormData();
			body.append('file', blob);
			const xhr = new XMLHttpRequest();
			xhr.withCredentials = true;
			xhr.addEventListener('load', () => {
				const contentType = xhr.getResponseHeader('Content-Type');
				const isJson = contentType && contentType.startsWith('application') && contentType.includes('json');
				resolve({
					body: isJson ? JSON.parse(xhr.response) : null,
					headers: {
						get(key: string) {
							return xhr.getResponseHeader(key);
						},
						has(key: string) {
							return !!xhr.getResponseHeader(key);
						},
					},
					status: xhr.status,
					statusText: xhr.statusText,
				});
			});
			xhr.addEventListener('error', (err) => reject(err));
			if (onProgress) {
				xhr.upload.addEventListener('progress', (e) => onProgress(e));
				xhr.upload.addEventListener('load', (e) => onProgress(e));
			}
			xhr.open(method, url);
			Object.entries(headers).forEach(([key, value]) => {
				xhr.setRequestHeader(key, value);
			});
			xhr.send(body);
		});
	}
}
