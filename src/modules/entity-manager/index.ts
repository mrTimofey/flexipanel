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
	type: string;
	// view key, used to identify this view (type is used if not set)
	key?: string;
	// human readable view title
	title?: string;
	// fields used as filters for this view
	filters?: IField[];
	// view component properties (based on type)
	props?: T;
}

export interface IForm {
	// form key, used to identify this form
	key: string;
	// form fields
	fields: IField[];
	// fields layout config
	layout?: unknown;
}

export interface IEntity {
	// entity object property name, used for entity instance identification and as a URL path segment
	idKey: string;
	// human readable entity name
	title: string;
	// API config
	api?: {
		// rest, graphql, grpc...
		type?: string;
		// endpoint
		path?: string;
	};
	// how this entity can be viewed (table, list, tree...)
	views: IView[];
	// how this entity can be created/updated
	forms?: IForm[];
}

export interface IViewType {
	component: PossiblyAsyncComponent;
}

export interface IDisplayType {
	component: PossiblyAsyncComponent;
}

export interface IFieldType {
	component: PossiblyAsyncComponent;
}

export default class EntityManager {
	protected entities: Record<string, IEntity> = {};
	protected viewTypes: Record<string, IViewType> = {};
	protected displayTypes: Record<string, IDisplayType> = {};
	protected fieldTypes: Record<string, IFieldType> = {};
	protected defaultViewType = '';

	public registerEntity(slug: string, entity: IEntity): this {
		this.entities[slug] = entity;
		return this;
	}

	public getEntity(key: string): IEntity | null {
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
