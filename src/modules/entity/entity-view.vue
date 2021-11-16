<template lang="pug">
modal-dialog(
	v-if="confirmDeleteTarget"
	@close="confirmDeleteTarget = null"
	@action-click="onDeleteConfirm($event.index === 0)"
	size="sm"
	:title="trans('deleteItem')"
	:actions="confirmActions"
) {{ trans('areYouSure') }}?
template(v-if="entityMeta && viewType")
	.d-flex.justify-content-center.py-5(v-if="initialLoading")
		.spinner.spinner-grow.text-primary
	.d-flex.flex-column.flex-grow-1(v-else-if="viewComponent && entityView")
		.flex-grow-0.flex-shrink-0
			.d-flex.align-items-center.my-2.px-3(v-if="store.hasPagination && realPerPageOptions.length && store.total > 0")
				span {{ trans('itemsPerPage') }}:
				field-select.ms-2(
					:model-value="store.perPage"
					:options="realPerPageOptions"
					:disabled="store.loading"
					@update:model-value="updatePerPage($event)"
				)
			.px-3.mb-3(v-if="entityView.filters && entityView.filters.length")
				.row
					.col(v-for="filter in entityView.filters")
						component(
							:is="fieldComponent(filter.type)"
							v-bind="filter.props"
							:model-value="filters[filter.key]"
							@update:model-value="onFilterInput(filter.key, $event)"
						)
							template(#label) {{ filter.label }}
		.fs-2.semibold.text-center.text-muted.px-3.py-5(v-if="store.total === 0") {{ store.loading ? `${trans('loading')}...` : trans('noItems') }}
		.flex-shrink-1.overflow-auto(v-else)
			component(
				:is="viewComponent"
				:selectable="selectable"
				v-bind="entityView.props"
				:items="store.items"
				:loading="store.loading"
				:no-actions="noActions"
				@item-click="onItemClick($event)"
			)
				template(#selection="{ item }")
					slot(name="selection" :item="item" :id="item[idKey]")
				template(#actions="{ item }")
					.d-flex.justify-content-end
						.btn-group.btn-group-sm
							a.btn.btn-primary(@click.prevent="onEditClick(item)" :href="itemRoute(item)")
								i.fa-solid.fa-pencil
							button.btn.btn-danger(@click.prevent="confirmAndDelete(item)")
								i.fa-solid.fa-trash
			.p-3
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
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed, watch, ref } from '@vue/runtime-core';
import { useRouter } from 'vue-router';
import EntityManager from '.';
import type { ListItem } from './stores/list';
import EntityListStore from './stores/list';
import { get, create, debounce } from '../vue-composition-utils';
import PageNav from './pagination.vue';
import FieldSelect from '../form/fields/select.vue';
import Translator from '../i18n';
import type { IModalAction } from '../modal/modal.vue';
import ModalDialog from '../modal/modal.vue';
import NotificationManager from '../notification';

export default defineComponent({
	components: { PageNav, FieldSelect, ModalDialog },
	props: {
		entity: {
			type: String,
			required: true,
		},
		view: {
			type: String,
			default: '',
		},
		noActions: {
			type: Boolean,
			default: false,
		},
		selectable: {
			type: Boolean,
			default: false,
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
		filters: {
			type: Object as PropType<Record<string, unknown>>,
			default: () => ({}),
		},
		sort: {
			type: Object as PropType<Record<string, unknown>>,
			default: () => ({}),
		},
	},
	emits: ['update:page', 'update:perPage', 'update:filters', 'edit-click', 'item-click'],
	setup(props, { emit }) {
		const store = create(EntityListStore);
		const entityManager = get(EntityManager);
		const notifier = get(NotificationManager);
		const translator = get(Translator);
		const router = useRouter();
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
		const idKey = computed(() => entityMeta.value?.itemUrlKey || 'id');
		const confirmDeleteTarget = ref<ListItem | null>(null);
		const initialLoading = ref(false);

		async function reloadInitialState() {
			if (store.loading || !entityView.value) {
				return;
			}
			initialLoading.value = true;
			store.setEntity(entityMeta.value);
			await store.reload({
				page: props.page > 1 ? props.page : 1,
				perPage: props.perPage || entityView.value.perPage || 0,
				filters: props.filters,
			});
			initialLoading.value = false;
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
		watch(
			() => props.filters,
			debounce((filters) => {
				store.reload({ page: 1, perPage: store.perPage, filters });
			}),
		);
		reloadInitialState();
		return {
			entityMeta,
			viewType,
			viewComponent,
			entityView,
			initialLoading,
			store,
			realPerPageOptions,
			confirmDeleteTarget,
			idKey,
			confirmActions: computed<IModalAction[]>(() => [
				{
					type: 'danger',
					title: translator.get('yes'),
				},
				{
					type: 'secondary',
					title: translator.get('no'),
				},
			]),
			trans: (key: string) => translator.get(key),
			updatePage(page: number): void {
				store.reload({ page, perPage: store.perPage });
				emit('update:page', page);
			},
			updatePerPage(perPage: number): void {
				store.reload({ perPage });
				emit('update:perPage', perPage);
			},
			onEditClick(item: ListItem): void {
				if (!entityMeta.value) {
					return;
				}
				emit('edit-click', { item, id: `${item[idKey.value]}` });
			},
			onItemClick(item: ListItem): void {
				if (!entityMeta.value) {
					return;
				}
				emit('item-click', { item, id: `${item[idKey.value]}` });
			},
			itemRoute(item: ListItem): string {
				if (!entityMeta.value) {
					return '#';
				}
				return router.resolve({
					name: 'entityItem',
					params: {
						entity: props.entity,
						id: `${item[entityMeta.value.itemUrlKey]}`,
					},
				}).href;
			},
			confirmAndDelete(item: ListItem): void {
				confirmDeleteTarget.value = item;
			},
			onDeleteConfirm(yes: boolean): void {
				if (yes && confirmDeleteTarget.value) {
					store
						.deleteItem(confirmDeleteTarget.value)
						.then(() =>
							store.reload({
								page: store.page,
								perPage: store.perPage,
							}),
						)
						.catch((err) => {
							notifier.push({
								type: 'error',
								body: `${err}`,
							});
						});
				}
				confirmDeleteTarget.value = null;
			},
			fieldComponent(type: string) {
				return entityManager.getFieldType(type)?.component;
			},
			onFilterInput(key: string, value: unknown) {
				const filters: Record<string, unknown> = { ...props.filters };
				if (value == null || value === '') {
					delete filters[key];
				} else {
					filters[key] = value;
				}
				emit('update:filters', filters);
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