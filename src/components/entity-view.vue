<template lang="pug">
template(v-if="entityMeta && viewType")
	h2 {{ tmpl(entityMeta.title, entityMeta) }}
	.d-flex.justify-content-center.py-5(v-if="store.loading && !store.items.length")
		.spinner.spinner-grow.text-primary
	template(v-else-if="viewComponent && entityView")
		.d-flex.align-items-center.my-3(v-if="realPerPageOptions.length")
			span {{ trans('itemsPerPage') }}:
			field-select.ms-2(
				:model-value="store.perPage"
				:options="realPerPageOptions"
				:disabled="store.loading"
				@update:model-value="updatePerPage($event)"
			)
		component(
			:is="viewComponent"
			v-bind="entityView.props"
			:items="store.items"
			:loading="store.loading"
		)
		page-nav.my-3(
			:model-value="store.page"
			:last-page="store.lastPage"
			:loading="store.loading"
			:total="store.total"
			:limit="store.perPage"
			@update:model-value="updatePage($event)"
		)
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed, watch } from 'vue';
import EntityManager from '../modules/entity-manager';
import TemplateEngine from '../modules/template';
import { EntityListStore } from '../modules/entity-store';
import { get, create } from '../modules/vue-composition-utils';
import PageNav from './pagination.vue';
import FieldSelect from './fields/select.vue';
import Translator from '../modules/i18n';

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
		perPageOptions: {
			type: Array as PropType<number[] | null>,
			default: null,
		},
	},
	emits: ['update:page', 'update:perPage'],
	setup(props, { emit }) {
		const store = create(EntityListStore);
		const entityManager = get(EntityManager);
		const tmpl = get(TemplateEngine);
		const translator = get(Translator);
		const entityMeta = computed(() => entityManager.getEntity(props.entity));
		const entityView = computed(() => {
			if (!entityMeta.value) {
				return null;
			}
			const { views } = entityMeta.value;
			return props.view ? views[props.view] : views[Object.keys(views)[0]];
		});
		const viewType = computed(() => entityView.value && entityManager.getViewType(entityView.value.type));
		// TODO skeleton and not found state
		const viewComponent = computed(() => viewType.value?.component);
		const realPerPageOptions = computed(() => props.perPageOptions || entityView.value?.perPageOptions || []);

		function reloadInitialState() {
			if (store.loading || !entityView.value) {
				return;
			}
			store.setEntity(entityMeta.value);
			store.reload({
				page: props.page > 1 ? props.page : 1,
				perPage: props.perPage || entityView.value.perPage || 0,
			});
		}
		watch(entityMeta, () => reloadInitialState());
		watch(entityView, () => {
			if (store.perPage !== entityView.value?.perPage && !(entityView.value?.perPageOptions || props.perPageOptions)?.includes(store.perPage)) {
				reloadInitialState();
			}
		});
		watch(
			() => props.page,
			(page) => {
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
		reloadInitialState();
		return {
			entityMeta,
			viewType,
			viewComponent,
			entityView,
			store,
			realPerPageOptions,
			tmpl: (src: string, data: unknown) => tmpl.exec(src, data),
			trans: (key: string) => translator.get(key),
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
