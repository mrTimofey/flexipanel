import { inject } from 'mini-ioc';
import ReactiveStore from '../reactive-store';
import type { IModalAction } from '.';
import Translator from '../i18n';

interface IState {
	title: string;
	body: string;
	actions: IModalAction[];
}

export default class ModalDialog extends ReactiveStore<IState> {
	constructor(protected trans = inject(Translator)) {
		super();
	}

	private onActionTrigger: ((actionIndex?: number) => void) | null = null;

	protected getInitialState(): IState {
		return {
			title: '',
			body: '',
			actions: [],
		};
	}

	public confirm(body: string, title?: string): Promise<boolean> {
		this.state.body = body;
		if (title) {
			this.state.title = title;
		}
		this.state.actions = [
			{
				type: 'danger',
				title: this.trans.get('yes'),
			},
			{
				type: 'secondary',
				title: this.trans.get('no'),
			},
		];
		return new Promise((resolve) => {
			this.onActionTrigger = (index) => {
				resolve(index === 0);
			};
		});
	}

	public answer(actionIndex?: number) {
		this.onActionTrigger?.(actionIndex);
		this.onActionTrigger = null;
		this.resetState();
	}

	get title() {
		return this.state.title;
	}

	get body() {
		return this.state.body;
	}

	get actions() {
		return this.state.actions;
	}
}
