<template lang="pug">
page-layout.page-entity-view(v-if="entityMeta")
	template(#breadcrumbs)
		li.breadcrumb-item {{ pageTitle }}
	template(#title) {{ pageTitle }}
	template(#header)
		button.btn.btn-primary(@click.prevent="goToCreatePage()") {{ entityMeta.createButtonText || trans('createEntityItem') }}
	entity-view(
		:entity="entity"
		:view="view"
		v-model:page="page"
		v-model:per-page="perPage"
		@edit-click="goToEditPage($event.id)"
	)
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from '@vue/runtime-core';
import { useRouter } from 'vue-router';
import { get, useRouteQueryParam, useTranslator } from '../modules/vue-composition-utils';
import EntityView from '../components/entity-view.vue';
import TemplateEngine from '../modules/template';
import EntityManager from '../modules/entity';
import Meta from '../modules/meta';
import PageLayout from '../components/page-layout.vue';

export default defineComponent({
	components: { EntityView, PageLayout },
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
		const router = useRouter();
		watchEffect(() => {
			pageMeta.pageTitle = entityMeta.value?.title || '...';
		});
		return {
			...useTranslator(),
			entityMeta,
			page: useRouteQueryParam('page', 1),
			perPage: useRouteQueryParam('perPage', 0),
			pageTitle: computed(() => entityMeta.value && tmpl.exec(entityMeta.value.title, entityMeta.value)),
			goToEditPage(id: string) {
				router.push({
					name: 'entityItem',
					params: { entity: props.entity, id },
				});
			},
			goToCreatePage() {
				router.push({
					name: 'entityItem',
					params: { entity: props.entity },
				});
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
