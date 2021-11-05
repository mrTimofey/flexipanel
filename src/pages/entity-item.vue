<template lang="pug">
.page-entity-item
	nav.mb-4.px-3
		ol.breadcrumb
			li.breadcrumb-item
				router-link(:to="{ name: 'index' }") AdminPanel
			li.breadcrumb-item
				router-link(:to="{ name: 'entityView', params: { entity } }") {{ entityTitle }}
			li.breadcrumb-item {{ pageTitle }}
	h1 Hello!!!
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from '@vue/runtime-core';
import EntityManager from '../modules/entity';
import Meta from '../modules/meta';
import { get, useTemplate } from '../modules/vue-composition-utils';

export default defineComponent({
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
		const { tpl } = useTemplate();
		watchEffect(() => {
			pageMeta.pageTitle = entityMeta.value?.title || '...';
		});
		return {
			entityTitle: computed(() => entityMeta.value && tpl(entityMeta.value.title, entityMeta.value)),
			pageTitle: computed(() =>
				props.id
					? // edit page
					  tpl(entityMeta.value?.editPageTitle || '', { id: props.id, meta: entityMeta.value })
					: // create page
					  tpl(entityMeta.value?.createPageTitle || '', { meta: entityMeta.value }),
			),
			entityMeta,
		};
	},
});
</script>
