<template lang="pug">
modal-dialog(
	v-if="confirmingDelete"
	@close="confirmingDelete = false"
	@action-click="onDeleteConfirm($event.index === 0)"
	size="sm"
	:title="trans('deleteItem')"
	:actions="confirmActions"
) {{ trans('areYouSure') }}?
.entity-form(v-if="entityMeta?.form" :class="{ loading: store.loading }")
	.d-flex.justify-content-center.py-5(v-if="initializing")
		.spinner.spinner-grow.text-primary
	form.px-3.pb-3(v-else @submit.prevent="saveAndReturn()" :class="{ loading: store.loading }")
		.entity-form-field.mb-3(v-for="field in entityMeta.form.fields")
			component(
				:is="fieldComponent(field.type)"
				:model-value="store.formItem[field.key]"
				:field-key="field.key"
				:entity-item="store.formItem"
				:related-items="store.relatedItems"
				:errors="store.formErrors[field.key]"
				v-bind="field.props"
				@update:model-value="onFieldInput(field.key, $event)"
			)
				template(#label) {{ field.label }}
		.btn-group.entity-form-actions
			button.btn.btn-primary(type="submit") {{ trans('saveAndReturn') }}
			button.btn.btn-outline-primary(type="button" @click.prevent="save()") {{ trans('save') }}
			button.btn.btn-outline-danger(v-if="store.itemId" type="button" @click.prevent="confirmAndDelete()") {{ trans('delete') }}
</template>

<script lang="ts">
import { defineComponent, computed, watchEffect, ref } from '@vue/runtime-core';
import EntityManager from '.';
import EntityItemStore from './stores/item';
import { get, create, useTranslator } from '../vue-composition-utils';
import type { IModalAction } from '../modal/modal.vue';
import ModalDialog from '../modal/modal.vue';
import NotificationManager from '../notification';
import { ValidationError } from './adapter';

export default defineComponent({
	components: { ModalDialog },
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
	emits: ['update:id', 'return'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		const notifier = get(NotificationManager);
		const entityMeta = computed(() => entityManager.getEntity(props.entity));
		const store = create(EntityItemStore);
		const initializing = ref(false);
		const confirmingDelete = ref(false);
		const { trans } = useTranslator();

		watchEffect(async () => {
			initializing.value = true;
			await store.loadEntityItem(entityMeta.value, props.id);
			initializing.value = false;
		});

		const handleErrors = async (cb: () => Promise<void>) => {
			try {
				await cb();
			} catch (err) {
				notifier.push({
					type: 'error',
					body: err instanceof ValidationError ? trans('checkValidationErrors') : `${err}`,
				});
				return false;
			}
			return true;
		};

		return {
			trans,
			entityMeta,
			store,
			initializing,
			confirmingDelete,
			confirmActions: computed<IModalAction[]>(() => [
				{
					type: 'danger',
					title: trans('yes'),
				},
				{
					type: 'secondary',
					title: trans('no'),
				},
			]),
			async save() {
				if ((await handleErrors(() => store.save())) && !store.hasErrors) {
					notifier.push({
						type: 'success',
						body: trans('successfullySaved'),
					});
				}
				if (props.id !== store.itemId) {
					emit('update:id', store.itemId);
				}
			},
			async saveAndReturn() {
				if ((await handleErrors(() => store.save())) && !store.hasErrors) {
					notifier.push({
						type: 'success',
						body: trans('successfullySaved'),
					});
					emit('return');
				}
			},
			fieldComponent(type: string) {
				return entityManager.getFieldType(type)?.component;
			},
			onFieldInput(key: string, value: unknown) {
				store.formItem[key] = value;
			},
			confirmAndDelete() {
				confirmingDelete.value = true;
			},
			async onDeleteConfirm(yes: boolean) {
				if (!yes || !confirmingDelete.value) {
					return;
				}
				if (await handleErrors(() => store.destroy())) {
					emit('return');
				}
				confirmingDelete.value = false;
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
.entity-form
	position relative
	&.loading::before
		content ''
		display block
		position absolute
		top 0
		right @top
		bottom @top
		left @top
		opacity 0.8
		background white
		z-index 5
		border-radius .25rem
</style>