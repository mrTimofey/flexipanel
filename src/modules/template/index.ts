import type { TemplateFunction } from 'dot';
import { compile } from 'dot';

export default class TemplateEngine {
	private compiled: Record<string, TemplateFunction> = {};

	exec(tmpl: string, data?: unknown): string {
		if (!this.compiled[tmpl]) {
			this.compiled[tmpl] = compile(tmpl);
		}
		return this.compiled[tmpl](data);
	}
}
