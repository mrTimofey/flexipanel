export default class KeyValueStorage {
	private keyPrefix = '__vueAdmin';

	setGlobalKeyPrefix(prefix: string): void {
		this.keyPrefix = prefix;
	}

	set(key: string, value: string): this {
		window.localStorage.setItem(`${this.keyPrefix}${key}`, value);
		return this;
	}

	get(key: string): string | null {
		return window.localStorage.getItem(`${this.keyPrefix}${key}`);
	}

	delete(key: string): this {
		window.localStorage.removeItem(`${this.keyPrefix}${key}`);
		return this;
	}
}
