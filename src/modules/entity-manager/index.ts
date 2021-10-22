import { defineAsyncComponent } from 'vue';
import type { Component, AsyncComponentLoader } from 'vue';

type PossiblyAsyncComponent = Component | AsyncComponentLoader;

export interface IField<T = unknown> {
	// entity object property name
	key: string;
	// human readable field title
	title: string;
	// field type (string, boolean, array...)
	type: string;
	// field component properties (based on type)
	props?: Record<string, T>;
}

export interface IView<T = unknown> {
	// view type (table, list, tree...)
	type?: string;
	// human readable view title
	title?: string;
	// fields used as filters for this view
	filters?: IField[];
	// view component properties (based on type)
	props?: T;
	// items per page
	perPage?: number;
	// per page selector options
	perPageOptions?: number[];
}

export interface IForm {
	// form key, used to identify this form
	key: string;
	// form fields
	fields: IField[];
	// fields layout config
	layout?: unknown;
}

export interface IEntityMeta {
	// entity object property name, used for entity instance identification and as a URL path segment
	idKey: string;
	// human readable entity name
	title?: string;
	// API type (rest, graphql, grpc...)
	apiType?: string;
	// API endpoint
	apiEndpoint: string;
	// how this entity can be viewed (table, list, tree...)
	views: Record<string, IView>;
}

export const entityMetaDefaults: Partial<IEntityMeta> = {
	apiType: 'rest',
};

export const viewDefaults: Partial<IView> = {
	type: 'table',
	perPage: 25,
	perPageOptions: [5, 10, 25, 50, 100],
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

type RegisteredEntity = Required<IEntityMeta> & { views: Record<string, Required<IView>> };

export default class EntityManager {
	protected entities: Record<string, RegisteredEntity> = {};
	protected viewTypes: Record<string, IViewType> = {};
	protected displayTypes: Record<string, IDisplayType> = {};
	protected fieldTypes: Record<string, IFieldType> = {};

	public registerEntity(slug: string, entity: IEntityMeta): this {
		const entityWithDefaults = { ...entityMetaDefaults, ...entity };
		const views = { ...entityWithDefaults.views };
		Object.entries(entityWithDefaults.views).forEach(([key, view]) => {
			views[key] = { ...viewDefaults, ...view } as Required<IView>;
		});
		entityWithDefaults.views = views;
		this.entities[slug] = entityWithDefaults as RegisteredEntity;
		return this;
	}

	public getEntity(key: string): RegisteredEntity | null {
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

	public registerFieldType(key: string, field: IFieldType): this {
		this.fieldTypes[key] = field;
		return this;
	}

	constructor() {
		this.registerViewType('table', {
			component: defineAsyncComponent(() => import('./views/table.vue')),
		});
		this.registerViewType('list', {
			component: defineAsyncComponent(() => import('./views/list.vue')),
		});
	}
}
