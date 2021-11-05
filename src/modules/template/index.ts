import type { TemplateFunction } from 'dot';
import { compile } from 'dot';
import { inject } from 'mini-ioc';
import Translator from '../i18n';

export default class TemplateEngine {
	private compiled: Record<string, TemplateFunction> = {};

	constructor(protected translator = inject(Translator)) {}

	exec(tmpl: string, data?: unknown): string {
		if (!this.compiled[tmpl]) {
			this.compiled[tmpl] = compile(tmpl, {
				trans: (key: string) => this.translator.get(key),
			});
		}
		return this.compiled[tmpl](data);
	}
}
