<template lang="pug">
page-layout.page-entity-view(v-if="entityMeta")
	template(#breadcrumbs)
		li.breadcrumb-item {{ pageTitle }}
	.px-3.pt-3
		h1.m-0.fs-3.flex-grow-1 {{ pageTitle }}
	entity-view(
		:entity-meta="entityMeta"
		:view="view"
		v-model:query="query"
		@item-click="$event.abilities.update && goToEditPage($event.id)"
		@edit-click="goToEditPage($event.id)"
	)
		template(#top-end)
			.my-2(v-if="!entityMeta.createDisabled")
				button.btn.btn-sm.btn-primary(@click.prevent="goToCreatePage()") {{ entityMeta.createButtonText || trans('createEntityItem') }}
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { get, useRouteQueryParam, useTranslator } from '../modules/vue-composition-utils';
import type { IApiQuery } from '../modules/entity/entity-view.vue';
import EntityView from '../modules/entity/entity-view.vue';
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
			query: useRouteQueryParam('query', {} as IApiQuery),
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
