<template lang="pug">
.form-field-entity-view(v-if="entityMeta && viewType")
	.d-flex.justify-content-center.py-5(v-if="initialLoading")
		.spinner.spinner-grow.text-primary
	.d-flex.flex-column.flex-grow-1(v-else-if="viewComponent && entityView")
		.flex-grow-0.flex-shrink-0
			.d-flex.align-items-center.px-3
				.d-flex.align-items-center.my-2.me-2(v-if="store.hasPagination && realPerPageOptions.length && store.total > 0")
					span {{ trans('itemsPerPage') }}:
					field-select.mx-2(
						required
						:model-value="store.perPage"
						:options="realPerPageOptions"
						:disabled="store.loading"
						@update:model-value="updatePerPage($event)"
					)
					span {{ trans('of') }} {{ store.total }}
				slot(name="top-end")
			.px-3.mb-3(v-if="entityView.filters && entityView.filters.length")
				.row
					.col(v-for="(filter, i) in entityView.filters")
						component(
							:is="fieldComponent(filter.type)"
							v-bind="filter.props"
							:model-value="filters[filter.key]"
							:autofocus="i === 0"
							@update:model-value="onFilterInput(filter.key, $event)"
						)
							template(#label) {{ filter.label }}
		.fs-2.semibold.text-center.text-muted.px-3.py-3(v-if="store.total === 0") {{ store.loading ? `${trans('loading')}...` : trans('noItems') }}
		.flex-shrink-1.overflow-auto(v-else)
			component(
				:is="viewComponent"
				:selectable="selectable"
				:sortable="sortable"
				v-bind="entityView.props"
				:items="store.items"
				:loading="store.loading"
				:loading-items="store.loadingItems"
				:no-actions="noActions"
				@item-click="onItemClick($event)"
				@item-input="onItemInput($event)"
				@item-action-click="onItemActionClick($event)"
			)
				template(#selection="{ item }")
					slot(name="selection" :item="item" :id="item[idKey]")
				template(#actions="{ item }")
					.d-flex.justify-content-end
						.btn-group.btn-group-sm
							a.btn.btn-primary(v-if="store.abilities.edit" @click.prevent="onEditClick(item)" :href="itemRoute(item)")
								i.fa-solid.fa-pencil
							button.btn.btn-danger(v-if="store.abilities.delete" @click.prevent="confirmAndDelete(item)")
								i.fa-solid.fa-trash
			.p-3(v-if="store.lastPage > 1 && store.hasPagination")
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
import type { PropType } from 'vue';
import { defineComponent, computed, watch, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { IRegisteredEntity } from '.';
import EntityManager from '.';
import type { ListItem } from './stores/list';
import EntityListStore from './stores/list';
import { get, create, debounce, useTranslator } from '../vue-composition-utils';
import PageNav from './pagination.vue';
import FieldSelect from '../form/fields/select.vue';
import ModalDialog from '../modal/dialogs';
import NotificationManager from '../notification';

function isPositionChangeEvent(event: { action: string }): event is { action: string; oldIndex: number; newIndex: number } {
	return event.action === 'itemPositionChange';
}

export default defineComponent({
	components: { PageNav, FieldSelect },
	props: {
		entityMeta: {
			type: Object as PropType<IRegisteredEntity | null>,
			default: null,
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
		sortable: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:page', 'update:perPage', 'update:filters', 'edit-click', 'item-click', 'item-action-click'],
	setup(props, { emit }) {
		const store = create(EntityListStore);
		const entityManager = get(EntityManager);
		const notifier = get(NotificationManager);
		const modalDialog = get(ModalDialog);
		const { trans } = useTranslator();
		const router = useRouter();
		const entityView = computed(() => {
			if (!props.entityMeta) {
				return null;
			}
			const { views } = props.entityMeta;
			return props.view ? views[props.view] : views[Object.keys(views)[0]];
		});
		const viewType = computed(() => entityView.value && entityManager.getViewType(entityView.value.type));
		// TODO skeleton and not found state
		const viewComponent = computed(() => viewType.value?.component);
		const realPerPageOptions = computed(() => props.perPageOptions || entityView.value?.perPageOptions || []);
		const idKey = computed(() => props.entityMeta?.itemUrlKey || 'id');
		const initialLoading = ref(false);

		async function reloadInitialState() {
			if (store.loading || !entityView.value) {
				return;
			}
			initialLoading.value = true;
			store.setEntity(props.entityMeta);
			await store.reload({
				page: props.page > 1 ? props.page : 1,
				perPage: props.perPage || entityView.value.perPage || 0,
				filters: props.filters,
			});
			initialLoading.value = false;
		}

		watch(
			() => props.entityMeta,
			() => reloadInitialState(),
		);
		watch(entityView, () => {
			if (store.perPage !== entityView.value?.perPage && !(entityView.value?.perPageOptions || props.perPageOptions)?.includes(store.perPage)) {
				reloadInitialState();
			}
		});
		watch(
			() => props.page,
			(page) => {
				if (page > 0 && store.page !== page) {
					store.reload({ page, perPage: store.perPage, filters: props.filters });
				}
			},
		);
		watch(
			() => props.perPage,
			(perPage) => {
				if (perPage > 0 && store.perPage !== perPage) {
					store.reload({ perPage, filters: props.filters });
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
			viewType,
			viewComponent,
			entityView,
			initialLoading,
			store,
			realPerPageOptions,
			idKey,
			trans,
			updatePage(page: number): void {
				store.reload({ page, perPage: store.perPage });
				emit('update:page', page);
			},
			updatePerPage(perPage: number): void {
				store.reload({ perPage });
				emit('update:perPage', perPage);
			},
			onEditClick(item: ListItem): void {
				if (!props.entityMeta) {
					return;
				}
				emit('edit-click', { item, id: `${item[idKey.value]}` });
			},
			onItemClick(item: ListItem): void {
				if (!props.entityMeta) {
					return;
				}
				emit('item-click', { item, id: `${item[idKey.value]}` });
			},
			onItemActionClick(event: { action: string; item: ListItem; [otherArgs: string]: unknown }): void {
				if (isPositionChangeEvent(event)) {
					store.moveItem(event.oldIndex, event.newIndex);
				} else {
					emit('item-action-click', { ...event, id: `${event.item[idKey.value]}` });
				}
			},
			itemRoute(item: ListItem): string {
				if (!props.entityMeta) {
					return '#';
				}
				return router.resolve({
					name: 'entityItem',
					params: {
						entity: props.entityMeta.slug,
						id: `${item[props.entityMeta.itemUrlKey]}`,
					},
				}).href;
			},
			async confirmAndDelete(item: ListItem) {
				const confirmed = await modalDialog.confirm(trans('areYouSure'), trans('deleteItem'));
				if (!confirmed) {
					return;
				}
				store
					.deleteItem(item)
					.then(() =>
						store.reload({
							page: store.page,
							perPage: store.perPage,
							filters: props.filters,
						}),
					)
					.catch((err) => {
						notifier.push({
							type: 'error',
							body: `${err}`,
						});
					});
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
			// external API
			reload() {
				store.reload({
					page: store.page,
					perPage: store.perPage,
					filters: props.filters,
				});
			},
			onItemInput({ item, values }: { item: Record<string, unknown>; values: Record<string, unknown> }) {
				store.patchItem(item, values);
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
