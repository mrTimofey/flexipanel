import { defineAsyncComponent } from '@vue/runtime-core';
import type { Component, AsyncComponentLoader } from '@vue/runtime-core';

type PossiblyAsyncComponent = Component | AsyncComponentLoader;

export interface IField {
	// human readable field title
	label?: string;
	// entity item object property key
	key: string;
	// field type (string, boolean, array...)
	type?: string;
	// field component properties (based on type)
	props?: Record<string, unknown>;
}

export interface IView {
	// view type (table, list, tree...)
	type?: string;
	// human readable view title
	title?: string;
	// fields used as filters for this view
	filters?: IField[];
	// view component properties (based on type)
	props?: Record<string, unknown>;
	// items per page
	perPage?: number;
	// per page selector options
	perPageOptions?: number[];
}

export interface IForm {
	// form fields
	fields: IField[];
	// fields layout config
	layout?: unknown;
}

export interface IEntityMeta {
	// entity object property name, used for entity instance identification and as a URL path segment
	itemUrlKey?: string;
	// human readable entity name
	title?: string;
	// API type (rest, graphql, grpc...)
	apiType?: string;
	// API endpoint
	apiEndpoint: string;
	// how this entity can be viewed (table, list, tree...)
	views: Record<string, IView>;
	// how this entity instances can be created/edited
	form?: IForm;
	createButtonText?: string;
	createPageTitle?: string;
	editPageTitle?: string;
}

export const entityMetaDefaults: Partial<IEntityMeta> = {
	itemUrlKey: 'id',
	apiType: 'jsonApi',
	createPageTitle: '{{#def.trans("newItem")}}',
	editPageTitle: '{{#def.trans("item")}} #{{=it.id}}',
};

export const viewDefaults: Partial<IView> = {
	type: 'table',
	perPage: 25,
	perPageOptions: [5, 10, 25, 50, 100],
};

export const fieldDefaults: Partial<IField> = {
	type: 'text',
	props: {},
};

export interface IViewType {
	component: PossiblyAsyncComponent;
}

export interface IDisplayType {
	component: PossiblyAsyncComponent;
}

export interface IFieldType {
	component: PossiblyAsyncComponent;
}

export interface IRegisteredEntity extends Required<IEntityMeta> {
	views: Record<string, Required<IView & { filters: Required<IField>[] }>>;
	form: IForm & { fields: Required<IField>[] };
}

function fillFields(fields: IField[]) {
	return fields.slice().map((field) => {
		const newField = { ...fieldDefaults, ...field };
		if (!newField.label) {
			newField.label = newField.key.split(/-_\sA-Z/).join(' ');
			newField.label = newField.label.substr(0, 1).toUpperCase() + newField.label.substr(1);
		}
		return newField;
	});
}

export default class EntityManager {
	protected entities: Record<string, IRegisteredEntity> = {};
	protected viewTypes: Record<string, IViewType> = {};
	protected displayTypes: Record<string, IDisplayType> = {};
	protected fieldTypes: Record<string, IFieldType> = {};

	public registerEntity(slug: string, entity: IEntityMeta): this {
		const entityWithDefaults = { ...entityMetaDefaults, ...entity };
		const views = { ...entityWithDefaults.views };
		Object.entries(entityWithDefaults.views).forEach(([key, view]) => {
			views[key] = { ...viewDefaults, ...view, filters: view.filters ? fillFields(view.filters) : [] } as Required<IView>;
		});
		entityWithDefaults.views = views;
		if (entityWithDefaults.form) {
			entityWithDefaults.form.fields = fillFields(entityWithDefaults.form.fields);
		} else {
			entityWithDefaults.form = { fields: [] };
		}
		this.entities[slug] = entityWithDefaults as IRegisteredEntity;
		return this;
	}

	public getEntity(key: string): IRegisteredEntity | null {
		return this.entities[key] || null;
	}

	public registerViewType(key: string, view: IViewType): this {
		this.viewTypes[key] = view;
		return this;
	}

	public getViewType(key: string): IViewType | null {
		return this.viewTypes[key] || null;
	}

	public registerDisplayType(key: string, display: IDisplayType): this {
		this.displayTypes[key] = display;
		return this;
	}

	public getDisplayType(key: string): IDisplayType | null {
		return this.displayTypes[key] || null;
	}

	public registerFieldType(key: string, field: IFieldType): this {
		this.fieldTypes[key] = field;
		return this;
	}

	public getFieldType(key: string): IFieldType | null {
		return this.fieldTypes[key] || null;
	}

	constructor() {
		this.registerViewType('table', {
			component: defineAsyncComponent(() => import('./views/table.vue')),
		});
		this.registerViewType('list', {
			component: defineAsyncComponent(() => import('./views/list.vue')),
		});
		this.registerDisplayType('text', {
			component: defineAsyncComponent(() => import('./displays/text.vue')),
		});
		this.registerDisplayType('html', {
			component: defineAsyncComponent(() => import('./displays/html.vue')),
		});
		this.registerDisplayType('image', {
			component: defineAsyncComponent(() => import('./displays/image.vue')),
		});
		this.registerFieldType('text', {
			component: defineAsyncComponent(() => import('../form/fields/text.vue')),
		});
		this.registerFieldType('textarea', {
			component: defineAsyncComponent(() => import('../form/fields/textarea.vue')),
		});
		this.registerFieldType('select', {
			component: defineAsyncComponent(() => import('../form/fields/select.vue')),
		});
		this.registerFieldType('integer', {
			component: defineAsyncComponent(() => import('../form/fields/integer.vue')),
		});
		this.registerFieldType('boolean', {
			component: defineAsyncComponent(() => import('../form/fields/boolean.vue')),
		});
		this.registerFieldType('file', {
			component: defineAsyncComponent(() => import('../form/fields/file.vue')),
		});
		this.registerFieldType('inline-svg', {
			component: defineAsyncComponent(() => import('../form/fields/inline-svg.vue')),
		});
		this.registerFieldType('entity', {
			component: defineAsyncComponent(() => import('./fields/entity.vue')),
		});
	}
}
