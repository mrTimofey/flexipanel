import ReactiveStore from '../reactive-store';
import NotificationRoot from './notifications.vue';

export { NotificationRoot };

const timeoutKey = Symbol('timeout');

export interface INotification {
	type?: string;
	title?: string;
	body: string;
	timeout?: number;
	[timeoutKey]?: ReturnType<typeof setTimeout>;
	id?: string | number;
}

interface IState {
	defaultTimeout: number;
	items: INotification[];
}

let idCounter = 0;
function uid() {
	idCounter += 1;
	return idCounter;
}

export default class NotificationManager extends ReactiveStore<IState> {
	getInitialState(): IState {
		return {
			items: [],
			defaultTimeout: Number(import.meta.env.NOTIFICATION_DEFAULT_CLOSE_TIMEOUT_MS) || 3000,
		};
	}

	push(notification: INotification): void {
		this.state.items.push(notification);
		if (!notification.id) {
			notification.id = uid();
		}
		this.startTimeout(notification);
	}

	close(notification: INotification | number): INotification | null {
		const index = typeof notification === 'number' ? notification : this.state.items.indexOf(notification);
		if (index === -1) {
			return null;
		}
		const item = this.state.items.splice(index, 1)[0];
		if (!item) {
			return null;
		}
		this.stopTimeout(item);
		return item;
	}

	stopTimeout(notification: INotification): void {
		if (notification[timeoutKey] === undefined) {
			return;
		}
		clearTimeout(notification[timeoutKey]);
		delete notification[timeoutKey];
	}

	startTimeout(notification: INotification): void {
		this.stopTimeout(notification);
		notification[timeoutKey] = setTimeout(() => {
			this.close(notification);
		}, notification.timeout || this.defaultTimeout);
	}

	get items(): IState['items'] {
		return this.state.items;
	}

	get defaultTimeout(): number {
		return this.state.defaultTimeout;
	}

	set defaultTimeout(v: number) {
		this.state.defaultTimeout = v;
	}
}
