import { inject } from 'mini-ioc';
import type { Component } from 'vue';
import { markRaw } from 'vue';
import ReactiveStore from '../reactive-store';
import type { IModalAction, ModalSize } from '.';
import Translator from '../i18n';

interface IState {
	title: string;
	body: string | Component;
	props: Record<string, unknown> | null;
	actions: IModalAction[];
	size: ModalSize;
}

interface IComponentDialogInput<T extends Record<string, unknown> = Record<string, unknown>> {
	component: Component;
	title?: string;
	props?: T;
	actions?: IModalAction[];
	size?: ModalSize;
}

export default class ModalDialog extends ReactiveStore<IState> {
	constructor(protected trans = inject(Translator)) {
		super();
	}

	private onActionTrigger: ((arg?: unknown) => void) | null = null;

	protected getInitialState(): IState {
		return {
			title: '',
			body: '',
			props: null,
			actions: [],
			size: 'sm',
		};
	}

	resetState(state?: IState): void {
		super.resetState(state);
		this.onActionTrigger = null;
	}

	public confirm(body: string, title?: string): Promise<boolean> {
		this.state.body = body;
		this.state.title = title || '';
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

	public component<T = unknown, P extends Record<string, unknown> = Record<string, unknown>>(args: IComponentDialogInput<P>): Promise<T | void> {
		this.state.body = markRaw(args.component);
		this.state.title = args.title || '';
		this.state.props = args.props || null;
		this.state.actions = args.actions || [];
		this.state.size = args.size || 'sm';
		return new Promise((resolve) => {
			this.onActionTrigger = (arg: unknown) => {
				resolve(arg as T | undefined);
			};
		});
	}

	public closeWithAnswer(actionIndex?: unknown) {
		this.onActionTrigger?.(actionIndex);
		this.resetState();
	}

	get title() {
		return this.state.title;
	}

	get body() {
		return this.state.body;
	}

	get props() {
		return this.state.props;
	}

	get actions() {
		return this.state.actions;
	}

	get size() {
		return this.state.size;
	}
}
