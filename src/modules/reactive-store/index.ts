import { reactive } from '@vue/runtime-core';

// eslint-disable-next-line @typescript-eslint/ban-types
export default abstract class ReactiveStore<T extends object> {
	protected state!: T;

	protected abstract getInitialState(): T;

	resetState(state?: T): void {
		Object.assign(this.state, state || this.getInitialState());
	}

	constructor(state?: T) {
		this.state = reactive(state || this.getInitialState()) as T;
	}
}
