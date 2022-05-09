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
			.px-1.my-2.position-relative.d-flex.flex-wrap(v-if="entityView.filters && entityView.filters.length" style="z-index:6")
				template(v-for="(filter, i) in entityView.filters")
					component.flex-grow-1.px-1(
						v-if="filter.type && filter.key"
						:key="filter.key"
						:is="fieldComponent(filter.type)"
						v-bind="filter.props"
						:model-value="filters[filter.key]"
						:autofocus="isActivated && i === 0"
						:context="context"
						@update:model-value="onFilterInput(filter.key, $event)"
					)
						template(#label)
							span(v-html="filter.label")
		.fs-5.semibold.text-center.text-muted.px-3.py-4(v-if="store.total === 0") {{ store.loading ? (loadingText || `${trans('loading')}...`) : (emptyText || trans('noItems')) }}
		.flex-shrink-1(v-else)
			component(
				:is="viewComponent"
				:selectable="selectable"
				:sortable="sortable"
				:context="context"
				v-bind="{ ...entityView.props, ...viewProps }"
				:items="store.items"
				:loading="store.loading"
				:loading-items="store.loadingItems"
				:no-actions="noActions"
				@item-click="onItemClick($event)"
				@item-input="onItemInput($event)"
				@item-action-click="onItemActionClick($event)"
			)
				template(#view-display="{ item }")
					slot(name="view-display" v-bind="getItemSlotBindings(item)")
				template(#item-before="{ item }")
					slot(name="item-before" v-bind="getItemSlotBindings(item)")
				template(#item-after="{ item }")
					slot(name="item-after" v-bind="getItemSlotBindings(item)")
				template(#selection="{ item }")
					slot(name="selection" v-bind="getItemSlotBindings(item)")
				template(#actions="{ item }")
					.d-flex.justify-content-end
						.btn-group.btn-group-sm
							slot(name="actions-before" v-bind="getItemSlotBindings(item)")
							slot(name="actions" v-bind="getItemSlotBindings(item)")
								a.btn.btn-primary(v-if="store.abilities.update" @click.prevent="onEditClick(item)" :href="itemRoute(item)")
									i.fas.fa-pencil
								button.btn.btn-danger(v-if="store.abilities.delete" @click.prevent="confirmAndDestroy(item)")
									i.fas.fa-trash
							slot(name="actions-after" v-bind="getItemSlotBindings(item)")
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
import { onDeactivated, onActivated, defineComponent, computed, watch, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { IRegisteredEntity, IView } from '.';
import EntityManager from '.';
import type { ListItem } from './stores/list';
import EntityListStore from './stores/list';
import { get, create, debounce, useTranslator } from '../vue-composition-utils';
import PageNav from './pagination.vue';
import FieldSelect from '../form/fields/select.vue';
import ModalDialog from '../modal/dialogs';
import NotificationManager from '../notification';
import FormFields from '../form/fields';

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
		viewProps: {
			type: Object,
			default: null,
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
		loadingText: {
			type: String,
			default: '',
		},
		emptyText: {
			type: String,
			default: '',
		},
		sharedStore: {
			type: Object as PropType<EntityListStore>,
			default: null,
		},
		context: {
			type: Object as PropType<Record<string, unknown> | null>,
			default: null,
		},
	},
	emits: ['update:page', 'update:perPage', 'update:filters', 'edit-click', 'item-click', 'item-action-click'],
	setup(props, { emit, expose }) {
		const store = props.sharedStore || create(EntityListStore);
		const entityManager = get(EntityManager);
		const formFields = get(FormFields);
		const notifier = get(NotificationManager);
		const modalDialog = get(ModalDialog);
		const { trans } = useTranslator();
		const router = useRouter();
		const entityView = computed(() => {
			if (!props.entityMeta) {
				return null;
			}
			const { views } = props.entityMeta;
			const view = props.view ? views[props.view] : views[Object.keys(views)[0]];
			return (view as Required<IView>) || null;
		});
		const viewType = computed(() => entityView.value && entityManager.getViewType(entityView.value.type));
		// TODO skeleton and not found state
		const viewComponent = computed(() => viewType.value?.component);
		const realPerPageOptions = computed(() => props.perPageOptions || entityView.value?.perPageOptions || []);
		const idKey = computed(() => props.entityMeta?.itemUrlKey || 'id');
		const initialLoading = ref(false);
		const isActivated = ref(false);

		const reloadInitialState = async (): Promise<void> => {
			if (store.loading || !entityView.value) {
				return;
			}
			initialLoading.value = true;
			store.setEntity(props.entityMeta);
			store.setStaticFilters(entityView.value.staticFilters);
			await store.reload({
				page: props.page > 1 ? props.page : 1,
				perPage: props.perPage || entityView.value.perPage || 0,
				filters: props.filters,
			});
			initialLoading.value = false;
		};
		const reload = (): Promise<void> =>
			store.reload({
				page: store.page,
				perPage: store.perPage,
				filters: props.filters,
			});
		const itemRoute = (item: ListItem): string => {
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
		};
		function onEditClick(item: ListItem): void {
			if (!props.entityMeta) {
				return;
			}
			emit('edit-click', { item, id: `${item[idKey.value]}` });
		}
		async function confirmAndDestroy(item: ListItem) {
			const confirmed = await modalDialog.confirm(`${trans('areYouSure')}?`, trans('deleteItem'));
			if (!confirmed) {
				return;
			}
			try {
				await store.deleteItem(item);
				store.reload({
					page: store.page,
					perPage: store.perPage,
					filters: props.filters,
				});
			} catch (err) {
				notifier.push({
					type: 'error',
					body: `${err}`,
				});
			}
		}

		watch([() => props.entityMeta, entityView], () => reloadInitialState());
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
		onActivated(() => {
			isActivated.value = true;
		});
		onDeactivated(() => {
			isActivated.value = false;
		});
		reloadInitialState();

		expose({ reload });
		return {
			viewType,
			viewComponent,
			entityView,
			initialLoading,
			store,
			realPerPageOptions,
			idKey,
			isActivated,
			trans,
			onEditClick,
			itemRoute,
			confirmAndDestroy,
			updatePage(page: number): void {
				store.reload({ page, perPage: store.perPage });
				emit('update:page', page);
			},
			updatePerPage(perPage: number): void {
				store.reload({ perPage });
				emit('update:perPage', perPage);
			},
			onItemClick(item: ListItem): void {
				if (!props.entityMeta) {
					return;
				}
				emit('item-click', { item, id: `${item[idKey.value]}`, abilities: store.abilities });
			},
			onItemActionClick(event: { action: string; item: ListItem; [otherArgs: string]: unknown }): void {
				if (isPositionChangeEvent(event)) {
					store.moveItem(event.oldIndex, event.newIndex);
				} else {
					emit('item-action-click', { ...event, id: `${event.item[idKey.value]}`, abilities: store.abilities });
				}
			},
			fieldComponent(type: string) {
				return formFields.getComponent(type);
			},
			onFilterInput(key: string | undefined, value: unknown) {
				if (!key) {
					return;
				}
				const filters: Record<string, unknown> = { ...props.filters };
				if (value == null || value === '') {
					delete filters[key];
				} else {
					filters[key] = value;
				}
				emit('update:filters', filters);
			},
			onItemInput({ item, values }: { item: Record<string, unknown>; values: Record<string, unknown> }) {
				store.patchItem(item, values).catch((err) => {
					notifier.push({
						type: 'error',
						body: `${err}`,
					});
				});
			},
			getItemSlotBindings(item: ListItem) {
				return {
					item,
					id: item[idKey.value],
					itemRoute: itemRoute(item),
					reload,
					onEditClick: () => onEditClick(item),
					confirmAndDestroy: () => confirmAndDestroy(item),
				};
			},
			reload,
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
</style>
