<template lang="pug">
.form-field-entity-view
	modal-dialog(
		v-if="editingItem !== null"
		size="lg"
		:title="trans(editingItem ? 'editEntityItem' : 'createEntityItem')"
		@close="editingItem = null"
	)
		entity-item(
			:entity-meta="relatedEntityMeta"
			:fixed-values="fixedItemValues"
			v-model:id="editingItem"
			@return="editingItem = null"
			@change="reloadView()"
			@delete="reloadView()"
		)
	.form-field-entity-view-label
		slot(name="label")
	.form-field-entity-view-content.border.rounded.shadow-sm.pb-1(v-if="entityItemId")
		.p-2
			button.btn.btn-primary.btn-sm(type="button" @click.prevent="editingItem = ''") {{ trans('createEntityItem') }}
		entity-view(
			ref="entityViewComponent"
			:entity-meta="relatedEntityMeta"
			:view="view"
			v-model:page="page"
			v-model:perPage="perPage"
			v-model:filters="filters"
			v-model:sort="sort"
			@edit-click="editingItem = $event.id"
			@item-click="editingItem = $event.id"
		)
	.form-field-entity-view-warning.border.rounded.shadow-sm.px-3.py-2(v-else)
		.fs-5.text-muted {{ trans('createToProceed') }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, ref, computed } from '@vue/runtime-core';
import EntityView from '../entity-view.vue';
import EntityItem from '../entity-item.vue';
import ModalDialog from '../../modal/modal.vue';
import clickOutside from '../../click-outside';
import { get, useTranslator } from '../../vue-composition-utils';
import EntityManager from '..';

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
		fieldKey: {
			type: String,
			default: '',
		},
		foreignKey: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const entityViewComponent = ref<typeof EntityView | null>(null);
		const page = ref<number>(1);
		const perPage = ref<number | undefined>(undefined);
		const filters = ref<Record<string, unknown>>({
			[props.foreignKey]: props.entityItemId,
		});
		const sort = ref<Record<string, unknown>>({});
		const editingItem = ref<string | null>(null);
		const fixedItemValues = computed(() => ({
			[props.foreignKey]: props.entityItemId,
		}));
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
		};
	},
});
</script>

<style lang="stylus" scoped></style>
