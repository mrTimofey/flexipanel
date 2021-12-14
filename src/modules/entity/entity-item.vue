<template lang="pug">
.entity-form(v-if="entityMeta?.form" :class="{ loading: store.loading }")
	modal-dialog(
		v-if="confirmingDelete"
		@close="confirmingDelete = false"
		@action-click="onDeleteConfirm($event.index === 0)"
		size="sm"
		:title="trans('deleteItem')"
		:actions="confirmActions"
	) {{ trans('areYouSure') }}?
	.d-flex.justify-content-center.py-5(v-if="initializing")
		.spinner.spinner-grow.text-primary
	.entity-form-layout(v-else)
		component(
			:is="entityMeta.form.layout"
			v-bind="{ store, formId, fields: availableFields, fieldComponent: EntityItemFormField }"
		)
			template(#form)
				slot(name="form" v-bind="{ store, formId, fields: availableFields, fieldComponent: EntityItemFormField }")
					form(@submit.prevent="saveAndReturn()" :id="formId")
						.mb-3(v-for="field in availableFields")
							entity-item-form-field(v-bind="{ field, store }")
			template(#actions)
				slot(name="actions" v-bind="{ save, saveAndReturn, confirmAndDelete }")
					.btn-group.entity-form-actions
						//- show "save and return" button only when @return is handled
						template(v-if="onReturn")
							button.btn.btn-primary(
								type="submit"
								:form="formId"
							) {{ trans('saveAndReturn') }}
							button.btn.btn-outline-primary(
								type="button"
								@click.prevent="save()"
							) {{ trans('save') }}
						button.btn.btn-primary(
							v-else
							type="submit"
							:form="formId"
						) {{ trans('save') }}
						button.btn.btn-outline-danger(
							v-if="store.itemId"
							type="button"
							@click.prevent="confirmAndDelete()"
						) {{ trans('delete') }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, computed, watchEffect, ref } from 'vue';
import type { IField, IRegisteredEntity } from '.';
import EntityItemStore from './stores/item';
import { get, create, useTranslator } from '../vue-composition-utils';
import type { IModalAction } from '../modal';
import ModalDialog from '../modal/modal.vue';
import NotificationManager from '../notification';
import { ValidationError } from './adapter';
import EntityItemFormField from './entity-item-form-field.vue';

let guidCounter = 0;
function guid() {
	guidCounter += 1;
	return `entity-item-${guidCounter}`;
}

export default defineComponent({
	components: { ModalDialog, EntityItemFormField },
	props: {
		entityMeta: {
			type: Object as PropType<IRegisteredEntity | null>,
			default: null,
		},
		id: {
			type: String,
			default: '',
		},
		fixedValues: {
			type: Object as PropType<Record<string, unknown>>,
			default: () => ({}),
		},
		defaultValues: {
			type: Object as PropType<Record<string, unknown>>,
			default: () => ({}),
		},
		formId: {
			type: String,
			default: () => guid(),
		},
		// eslint-disable-next-line vue/require-default-prop
		onReturn: Function,
		// eslint-disable-next-line vue/require-default-prop
		onDelete: Function,
	},
	emits: ['update:id', 'return', 'delete', 'change'],
	setup(props, { emit }) {
		const notifier = get(NotificationManager);
		const store = create(EntityItemStore);
		const initializing = ref(false);
		const confirmingDelete = ref(false);
		const { trans } = useTranslator();

		watchEffect(async () => {
			initializing.value = true;
			await store.loadEntityItem(props.entityMeta, props.id);
			Object.entries(props.fixedValues).forEach(([key, value]) => {
				store.formItem[key] = value;
			});
			if (!props.id) {
				Object.entries(props.defaultValues).forEach(([key, value]) => {
					store.formItem[key] = value;
				});
			}
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
			EntityItemFormField,
			trans,
			store,
			initializing,
			confirmingDelete,
			availableFields: computed<Required<IField>[]>(
				() =>
					props.entityMeta?.form.fields.filter<Required<IField>>(
						(field): field is Required<IField> => !field.hidden && (!field.key || !Object.prototype.hasOwnProperty.call(props.fixedValues, field.key)),
					) || [],
			),
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
					emit('change', { id: store.itemId, item: store.formItem });
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
					emit('change', { id: store.itemId, item: store.formItem });
					emit('return', { id: store.itemId, item: store.formItem });
				}
			},
			confirmAndDelete() {
				confirmingDelete.value = true;
			},
			async onDeleteConfirm(yes: boolean) {
				confirmingDelete.value = false;
				if (yes && (await handleErrors(() => store.destroy()))) {
					emit('delete');
					emit('return');
				}
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
		top -0.25rem
		right @top
		bottom @top
		left @top
		opacity 0.8
		background white
		z-index 5
		border-radius .25rem
</style>
