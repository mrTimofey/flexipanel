<template lang="pug">
template(v-if="entityMeta && viewType")
	h2 {{ tmpl(entityMeta.title, entityMeta) }}
	.d-flex.justify-content-center.py-5(v-if="store.loading && !store.items.length")
		.spinner.spinner-grow.text-primary
	template(v-else-if="viewComponent && entityView")
		component(
			:is="viewComponent"
			v-bind="entityView.props"
			:items="store.items"
			:loading="store.loading"
		)
		field-select(
			:model-value="store.perPage"
			:options="[5, 10, 25, 100]"
			:disabled="store.loading"
			@update:model-value="updatePerPage($event)"
		)
		page-nav(
			:model-value="store.page"
			:last-page="store.lastPage"
			:loading="store.loading"
			:total="store.total"
			:limit="store.perPage"
			@update:model-value="updatePage($event)"
		)
</template>

<script lang="ts">
import type { Component, AsyncComponentLoader } from 'vue';
import { defineComponent, computed, shallowRef, watch, watchEffect } from 'vue';
import EntityManager from '../modules/entity-manager';
import TemplateEngine from '../modules/template';
import { EntityListStore } from '../modules/entity-store';
import { get, create } from '../vue-composition-utils';
import PageNav from './pagination.vue';
import FieldSelect from './fields/select.vue';

export default defineComponent({
	components: { PageNav, FieldSelect },
	props: {
		entity: {
			type: String,
			required: true,
		},
		view: {
			type: String,
			default: '',
		},
		page: {
			type: Number,
			default: 0,
		},
		perPage: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:page', 'update:perPage'],
	setup(props, { emit }) {
		const store = create(EntityListStore);
		const entityManager = get(EntityManager);
		const tmpl = get(TemplateEngine);
		const entityMeta = computed(() => entityManager.getEntity(props.entity));
		const entityView = computed(() => {
			if (!entityMeta.value?.views.length) {
				return null;
			}
			const { views } = entityMeta.value;
			if (props.view) {
				return views.find((view) => props.view === view.key) || views.find((view) => props.view === view.type);
			}
			return views[0];
		});
		const viewType = computed(() => entityView.value && entityManager.getViewType(entityView.value.type));
		// TODO: skeleton and not found state
		const viewComponent = shallowRef<Component | null>(null);
		watchEffect(async () => {
			if (typeof viewType.value?.component === 'function') {
				const loader = viewType.value.component as AsyncComponentLoader;
				viewComponent.value = (await loader()).default || null;
			} else {
				viewComponent.value = viewType.value?.component || null;
			}
		});
		watch(
			entityMeta,
			() => {
				store.setEntity(entityMeta.value);
				store.reload({
					page: props.page < 1 ? store.page : props.page,
					perPage: props.perPage < 1 ? store.perPage : props.perPage,
				});
			},
			{ immediate: true },
		);
		watch(
			() => props.page,
			(page) => {
				// TODO triggers twice when perPage select is changed
				if (page > 0 && store.page !== page) {
					store.reload({ page, perPage: store.perPage });
				}
			},
		);
		watch(
			() => props.perPage,
			(perPage) => {
				if (perPage > 0 && store.perPage !== perPage) {
					store.reload({ perPage });
				}
			},
		);
		return {
			entityMeta,
			viewType,
			viewComponent,
			entityView,
			store,
			tmpl: (src: string, data: unknown) => tmpl.exec(src, data),
			updatePage(page: number) {
				store.reload({ page, perPage: store.perPage });
				emit('update:page', page);
			},
			updatePerPage(perPage: number) {
				store.reload({ perPage });
				emit('update:perPage', perPage);
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
</style>
