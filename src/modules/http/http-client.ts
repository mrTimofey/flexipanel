export default abstract class HttpClient {
	abstract fetch<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T>;

	get<T>(url: string): Promise<T> {
		return this.fetch(url, 'GET');
	}

	post<T>(url: string, body?: unknown): Promise<T> {
		return this.fetch(url, 'POST', body);
	}

	put<T>(url: string, body?: unknown): Promise<T> {
		return this.fetch(url, 'PUT', body);
	}

	patch<T>(url: string, body?: unknown): Promise<T> {
		return this.fetch(url, 'PATCH', body);
	}

	delete<T>(url: string, body?: unknown): Promise<T> {
		return this.fetch(url, 'DELETE', body);
	}
}
