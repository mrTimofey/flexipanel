import type { TemplateFunction } from 'dot';
import { template } from 'dot';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TemplateHelper = (...args: any[]) => any;

export default class TemplateEngine {
	private compiled: Record<string, TemplateFunction> = {};
	private helpers: Record<string, TemplateHelper> = {};

	registerHelper(name: string, fn: TemplateHelper) {
		this.helpers[name] = fn;
	}

	exec(tmpl: string, data?: unknown): string {
		if (!this.compiled[tmpl]) {
			this.compiled[tmpl] = template(tmpl, { argName: ['h', 'it'] });
		}
		return this.compiled[tmpl]({ h: this.helpers, it: data });
	}
}
