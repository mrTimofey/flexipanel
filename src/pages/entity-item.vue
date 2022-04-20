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
			v-model:dirty="isDirty"
			@return="router.back()"
		)
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect, ref, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import Meta from '../modules/meta';
import { get, requireEntityMeta, useTemplate } from '../modules/vue-composition-utils';
import EntityItem from '../modules/entity/entity-item.vue';
import PageLayout from '../components/page-layout.vue';
import ModalDialog from '../modules/modal/dialogs';
import Translator from '../modules/i18n';

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
		const pageMeta = get(Meta);
		const dialog = get(ModalDialog);
		const trans = get(Translator);
		const entityMeta = computed(() => requireEntityMeta(props.entity));
		const isDirty = ref(false);
		const router = useRouter();
		const route = useRoute();
		const { tpl } = useTemplate();
		watchEffect(() => {
			pageMeta.pageTitle = entityMeta.value?.title || '...';
		});
		const confirmWindowClose = (e: BeforeUnloadEvent): string | void => {
			if (!isDirty.value) {
				return;
			}
			e.returnValue = '';
		};

		onBeforeRouteLeave(() => {
			if (!isDirty.value) {
				return Promise.resolve(true);
			}
			return dialog.confirm(trans.get('confirmUnsaved'));
		});

		onMounted(() => {
			window.addEventListener('beforeunload', confirmWindowClose);
		});

		onBeforeUnmount(() => {
			window.removeEventListener('beforeunload', confirmWindowClose);
		});

		return {
			entityMeta,
			router,
			isDirty,
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
