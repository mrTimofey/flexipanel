<template lang="pug">
.form-field-entity-view
	modal-dialog.bg-light(
		v-if="editingItem !== null"
		:size="itemModalSize"
		@close="clearEditingItem()"
	)
		template(#header)
			.modal-header
				.modal-entity-item-container.d-flex.align-items-center.flex-grow-1
					h5.modal-title.flex-grow-1 {{ trans(editingItem ? 'editEntityItem' : 'createEntityItem') }}
					button.btn-close(@click="clearEditingItem()")
		.modal-entity-item-container.bg-white.shadow-sm.rounded.p-3.my-2
			entity-item(
				:entity-meta="relatedEntityMeta"
				:fixed-values="fixedItemValues"
				:default-values="defaultItemValues || undefined"
				:id="editingItem.id"
				@update:id="editingItem = { id: $event }"
				@return="clearEditingItem()"
				@change="reload()"
				@delete="reload()"
			)
	.form-field-entity-view-label
		slot(name="label")
	.form-field-entity-view-content.border.rounded.shadow-sm(v-if="formObjectId")
		slot(name="actions")
			.btn-group.btn-group-sm.p-2(v-if="!readonly")
				slot(name="actions-before")
				button.btn.btn-primary(type="button" @click.prevent="onCreateButtonClick()") {{ createButtonText || trans('createEntityItem') }}
				slot(name="actions-after")
		slot(name="view-before")
		entity-view(
			ref="entityViewComponent"
			:entity-meta="relatedEntityMeta"
			:view="view"
			:no-actions="readonly"
			:per-page-options="perPageOptions"
			:sortable="sortable"
			:selectable="selectable"
			v-model:page="page"
			v-model:perPage="perPage"
			v-model:filters="filters"
			v-model:sort="sort"
			@edit-click="editingItem = { id: $event.id }"
			@item-click="editingItem = { id: $event.id }"
			@item-action-click="onItemActionClick($event)"
		)
			template(#selection="bindings")
				slot(name="selection" v-bind="bindings")
		slot(name="view-after")
	.form-field-entity-view-warning.border.rounded.shadow-sm.px-3.py-2(v-else)
		.fs-5.text-muted {{ trans('createToProceed') }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Container from 'mini-ioc';
import EntityView from '../entity-view.vue';
import EntityItem from '../entity-item.vue';
import type { ModalSize } from '../../modal';
import ModalDialog from '../../modal/modal.vue';
import clickOutside from '../../click-outside';
import { get, useTranslator } from '../../vue-composition-utils';
import EntityManager from '..';
import type { ListItem } from '../stores/base';
import adapters from '../adapters';
import { getCommonProps } from '../../form/fields/common';

interface IItemData {
	id: string;
	parent?: string;
}

export default defineComponent({
	name: 'EntityViewField',
	components: { EntityView, ModalDialog, EntityItem },
	directives: { clickOutside },
	props: {
		...getCommonProps({
			type: Object as unknown as PropType<never>,
			default: null,
		}),
		relatedEntity: {
			type: String,
			default: '',
		},
		view: {
			type: String,
			default: '',
		},
		itemModalSize: {
			type: String as PropType<ModalSize>,
			default: 'lg',
		},
		foreignKey: {
			type: String,
			default: '',
		},
		parentForeignKey: {
			type: String,
			default: '',
		},
		createButtonText: {
			type: String,
			default: '',
		},
		readonly: {
			type: Boolean,
			default: false,
		},
		perPageOptions: {
			type: Array as PropType<number[]>,
			default: null,
		},
		// fill creation form for the child entity from parent fields
		// { [child key]: [parent key], ... }
		itemDefaultsMap: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
		idField: {
			type: String,
			default: '',
		},
		sortable: {
			type: Boolean,
			default: false,
		},
		selectable: {
			type: Boolean,
			default: false,
		},
		// send POST request with { ...fixedValues, ...defaultValues } on create button click
		instantCreateEnabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['item-action'],
	setup(props, { emit }) {
		const container = get(Container);
		const route = useRoute();
		const router = useRouter();
		const entityViewComponent = ref<typeof EntityView | null>(null);
		const page = ref<number>(1);
		const perPage = ref<number | undefined>(undefined);
		const filters = ref<Record<string, unknown>>({
			[props.foreignKey]: props.idField ? props.formObject[props.idField] : props.formObjectId,
		});
		const sort = ref<Record<string, unknown>>({});
		const queryKey = () => `${props.fieldKey}.${props.relatedEntity}`;
		const editingItem = computed<IItemData | null>({
			set(v) {
				const query = { ...route.query };
				if (v === null) {
					delete query[queryKey()];
				} else {
					query[queryKey()] = JSON.stringify(v);
				}
				router.replace({ ...route, query });
			},
			get() {
				const key = queryKey();
				if (route.query[key] === undefined) {
					return null;
				}
				return JSON.parse(`${route.query[queryKey()]}`) as IItemData;
			},
		});
		const fixedItemValues = computed(() => {
			const values: Record<string, unknown> = {};
			if (props.foreignKey && props.formObjectId) {
				values[props.foreignKey] = props.idField ? props.formObject[props.idField] : props.formObjectId;
			}
			if (editingItem.value?.parent && props.parentForeignKey) {
				values[props.parentForeignKey] = editingItem.value?.parent;
			}
			return values;
		});
		const defaultItemValues = computed<Record<string, unknown> | null>(() => {
			if (!props.itemDefaultsMap) {
				return null;
			}
			const values: Record<string, unknown> = {};
			Object.entries(props.itemDefaultsMap).forEach(([childKey, parentKey]) => {
				values[childKey] = props.formObject[parentKey];
			});
			return values;
		});
		const entityManager = get(EntityManager);
		const relatedEntityMeta = computed(() => entityManager.getEntity(props.relatedEntity));

		return {
			...useTranslator(),
			relatedEntityMeta,
			page,
			perPage,
			filters,
			sort,
			fixedItemValues,
			defaultItemValues,
			editingItem,
			entityViewComponent,
			clearEditingItem() {
				editingItem.value = null;
			},
			onItemActionClick(event: { action: string; item: ListItem; id: string; [otherArgs: string]: unknown }) {
				if (event.action === 'createChild') {
					editingItem.value = {
						id: '',
						parent: event.id,
					};
				} else {
					emit('item-action', event);
				}
			},
			async onCreateButtonClick() {
				if (relatedEntityMeta.value && props.instantCreateEnabled) {
					const adapter = container.get(await adapters[relatedEntityMeta.value.apiType]());
					await adapter.saveItem(relatedEntityMeta.value.apiEndpoint, {
						...defaultItemValues.value,
						...fixedItemValues.value,
					});
					entityViewComponent.value?.reload();
				} else {
					editingItem.value = { id: '' };
				}
			},

			// public API
			reload() {
				entityViewComponent.value?.reload();
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.modal-entity-item-container
	max-width 1320px
	margin 0 auto
</style>
