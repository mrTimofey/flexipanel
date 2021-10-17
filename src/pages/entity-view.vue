<template lang="pug">
.page-entity-view
	template(v-if="entityMeta && viewType")
		h1 {{ tmpl(entityMeta.title, entityMeta) }}
		.d-flex.justify-content-center.py-5(v-if="store.loading && !store.items.length")
			.spinner.spinner-grow.text-primary
		template(v-else-if="viewComponent && entityView")
			component(
				:is="viewComponent"
				v-bind="entityView.props"
				:items="store.items"
				:loading="store.loading"
			)
			page-nav(
				v-model:page="currentPage"
				:last-page="store.lastPage"
				:loading="store.loading"
				:total="store.total"
				:limit="store.perPage"
			)
</template>

<script lang="ts">
import type { Component, AsyncComponentLoader } from 'vue';
import { defineComponent, computed, shallowRef, watchEffect } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import EntityManager from '../modules/entity-manager';
import { EntityListStore } from '../modules/entity-store';
import { get } from '../vue-composition-utils';
import PageNav from '../components/pagination.vue';
import TemplateEngine from '../modules/template';

export default defineComponent({
	components: { RouterLink, PageNav },
	props: {
		entity: {
			type: String,
			required: true,
		},
		view: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		// TODO: move router interaction up
		const route = useRoute();
		const router = useRouter();
		const entityManager = get(EntityManager);
		const store = get(EntityListStore);
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
		const currentPage = computed({
			get() {
				return parseInt(route.query.page?.toString() || '1', 10) || 1;
			},
			set(page: number) {
				const query = { ...route.query };
				if (page === 1) {
					delete query.page;
				} else {
					query.page = page.toString();
				}
				router.replace({ query });
			},
		});
		watchEffect(async () => {
			if (typeof viewType.value?.component === 'function') {
				const loader = viewType.value.component as AsyncComponentLoader;
				viewComponent.value = (await loader()).default || null;
			} else {
				viewComponent.value = viewType.value?.component || null;
			}
		});
		watchEffect(() => {
			store.setEntity(entityMeta.value);
			store.reload({ page: currentPage.value });
		});
		return {
			entityMeta,
			viewType,
			viewComponent,
			currentPage,
			entityView,
			store,
			tmpl: (src: string, data: unknown) => tmpl.exec(src, data),
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
</style>
