<template lang="pug">
page-layout.page-entity-item
	template(#breadcrumbs)
		li.breadcrumb-item
			router-link(:to="{ name: 'entityView', params: { entity } }") {{ entityTitle }}
		li.breadcrumb-item {{ pageTitle }}
	.p-3
		entity-item(
			:entity-meta="entityMeta"
			v-model:id="routeSyncId"
			@return="router.back()"
		)
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EntityManager from '../modules/entity';
import Meta from '../modules/meta';
import { get, useTemplate } from '../modules/vue-composition-utils';
import EntityItem from '../modules/entity/entity-item.vue';
import PageLayout from '../components/page-layout.vue';

export default defineComponent({
	components: { EntityItem, PageLayout },
	props: {
		entity: {
			type: String,
			required: true,
		},
		id: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const entityManager = get(EntityManager);
		const pageMeta = get(Meta);
		const entityMeta = computed(() => entityManager.getEntity(props.entity));
		const router = useRouter();
		const route = useRoute();
		const { tpl } = useTemplate();
		watchEffect(() => {
			pageMeta.pageTitle = entityMeta.value?.title || '...';
		});
		return {
			entityMeta,
			router,
			entityTitle: computed(() => entityMeta.value && tpl(entityMeta.value.title, entityMeta.value)),
			pageTitle: computed(() =>
				props.id
					? // edit page
					  tpl(entityMeta.value?.editPageTitle || '', { id: props.id, meta: entityMeta.value })
					: // create page
					  tpl(entityMeta.value?.createPageTitle || '', { meta: entityMeta.value }),
			),
			routeSyncId: computed({
				get() {
					return props.id;
				},
				set(id: string) {
					if (!route.name) {
						return;
					}
					router.replace({ name: route.name, params: { ...route.params, id } });
				},
			}),
		};
	},
});
</script>
