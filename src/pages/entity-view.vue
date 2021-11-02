<template lang="pug">
.page-entity-view(v-if="entityMeta")
	nav.mb-4.px-3
		ol.breadcrumb
			li.breadcrumb-item
				router-link(:to="{ name: 'index' }") AdminPanel
			li.breadcrumb-item {{ pageTitle }}
	.bg-white.shadow-sm.rounded
		h1.px-3.pt-3.mb-3 {{ pageTitle }}
		entity-view(
			:entity="entity"
			:view="view"
			v-model:page="page"
			v-model:per-page="perPage"
		)
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from 'vue';
import { get, useRouteQueryParam } from '../modules/vue-composition-utils';
import EntityView from '../components/entity-view.vue';
import TemplateEngine from '../modules/template';
import EntityManager from '../modules/entity';
import Meta from '../modules/meta';

export default defineComponent({
	components: { EntityView },
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
		const entityManager = get(EntityManager);
		const tmpl = get(TemplateEngine);
		const pageMeta = get(Meta);
		const entityMeta = computed(() => entityManager.getEntity(props.entity));
		watchEffect(() => {
			pageMeta.pageTitle = entityMeta.value?.title || '...';
		});
		return {
			entityMeta,
			page: useRouteQueryParam('page', 1),
			perPage: useRouteQueryParam('perPage', 0),
			pageTitle: computed(() => entityMeta.value && tmpl.exec(entityMeta.value.title, entityMeta.value)),
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
</style>
