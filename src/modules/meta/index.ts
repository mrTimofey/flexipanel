import { inject } from 'mini-ioc';
import AppConfig from '../app-config';

export default class Meta {
	constructor(protected appConfig = inject(AppConfig)) {}

	get pageTitle(): string {
		return window.document.title;
	}

	set pageTitle(newTitle: string) {
		window.document.title = newTitle ? `${newTitle} | ${this.appConfig.appTitle}` : this.appConfig.appTitle;
	}
}
