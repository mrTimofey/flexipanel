import { reactive } from 'vue';

// eslint-disable-next-line @typescript-eslint/ban-types
export default abstract class ReactiveStore<T extends object> {
	protected state!: T;

	protected abstract getInitialState(): T;

	resetState(state?: T): void {
		this.state = reactive(state || this.getInitialState()) as T;
	}

	constructor(state?: T) {
		this.resetState(state);
	}
}
