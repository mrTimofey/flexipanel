<template lang="pug">
.form-field-entity-view
	modal-dialog.bg-light(
		v-if="editingItem !== null"
		:size="itemModalSize"
		@close="clearEditingItem()"
	)
		template(#header)
			.modal-header
				.container.d-flex.align-items-center
					h5.modal-title {{ trans(editingItem ? 'editEntityItem' : 'createEntityItem') }}
					button.btn-close(@click="clearEditingItem()")
		.container.bg-white.shadow-sm.rounded.p-3.my-2
			entity-item(
				:entity-meta="relatedEntityMeta"
				:fixed-values="fixedItemValues"
				:id="editingItem.id"
				@update:id="editingItem = { id: $event }"
				@return="clearEditingItem()"
				@change="reloadView()"
				@delete="reloadView()"
			)
	.form-field-entity-view-label
		slot(name="label")
	.form-field-entity-view-content.border.rounded.shadow-sm(v-if="entityItemId")
		.p-2(v-if="!readonly")
			button.btn.btn-primary.btn-sm(type="button" @click.prevent="editingItem = { id: '' }") {{ createButtonText || trans('createEntityItem') }}
		entity-view(
			ref="entityViewComponent"
			:entity-meta="relatedEntityMeta"
			:view="view"
			:no-actions="readonly"
			:per-page-options="perPageOptions"
			v-model:page="page"
			v-model:perPage="perPage"
			v-model:filters="filters"
			v-model:sort="sort"
			@edit-click="editingItem = { id: $event.id }"
			@item-click="editingItem = { id: $event.id }"
			@item-action-click="onItemActionClick($event)"
		)
	.form-field-entity-view-warning.border.rounded.shadow-sm.px-3.py-2(v-else)
		.fs-5.text-muted {{ trans('createToProceed') }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, ref, computed } from '@vue/runtime-core';
import { useRoute, useRouter } from 'vue-router';
import EntityView from '../entity-view.vue';
import EntityItem from '../entity-item.vue';
import type { ModalSize } from '../../modal/modal.vue';
import ModalDialog from '../../modal/modal.vue';
import clickOutside from '../../click-outside';
import { get, useTranslator } from '../../vue-composition-utils';
import EntityManager from '..';
import type { ListItem } from '../stores/base';

interface IItemData {
	id: string;
	parent?: string;
}

export default defineComponent({
	components: { EntityView, ModalDialog, EntityItem },
	directives: { clickOutside },
	props: {
		relatedEntity: {
			type: String,
			default: '',
		},
		view: {
			type: String,
			default: '',
		},
		relatedItems: {
			type: Object as PropType<Record<string, Record<string, Record<string, unknown>>>>,
			default: () => ({}),
		},
		entityItem: {
			type: Object,
			default: null,
		},
		entityItemId: {
			type: String,
			default: '',
		},
		itemModalSize: {
			type: String as PropType<ModalSize>,
			default: 'lg',
		},
		fieldKey: {
			type: String,
			default: '',
		},
		fieldIndex: {
			type: Number,
			default: -1,
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
		idField: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const route = useRoute();
		const router = useRouter();
		const entityViewComponent = ref<typeof EntityView | null>(null);
		const page = ref<number>(1);
		const perPage = ref<number | undefined>(undefined);
		const filters = ref<Record<string, unknown>>({
			[props.foreignKey]: props.idField ? props.entityItem[props.idField] : props.entityItemId,
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
			if (props.foreignKey && props.entityItemId) {
				values[props.foreignKey] = props.idField ? props.entityItem[props.idField] : props.entityItemId;
			}
			if (editingItem.value?.parent && props.parentForeignKey) {
				values[props.parentForeignKey] = editingItem.value?.parent;
			}
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
			editingItem,
			entityViewComponent,
			reloadView() {
				entityViewComponent.value?.reload();
			},
			clearEditingItem() {
				editingItem.value = null;
			},
			onItemActionClick(event: { action: string; item: ListItem; id: string }) {
				if (event.action !== 'createChild') {
					return;
				}
				editingItem.value = {
					id: '',
					parent: event.id,
				};
			},
		};
	},
});
</script>

<style lang="stylus" scoped></style>
