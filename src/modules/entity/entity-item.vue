<template lang="pug">
.entity-form(v-if="entityMeta?.form && store.abilities[id ? 'edit' : 'create']" :class="{ loading: store.loading }")
	.d-flex.justify-content-center.py-5(v-if="initializing")
		.spinner.spinner-grow.text-primary
	.entity-form-layout(v-else)
		component(
			:is="entityMeta.form.layout"
			v-bind="{ store, context, formId, fields: availableFields, fieldComponent: EntityItemFormField }"
			@submit="submit()"
		)
			template(#form)
				slot(name="form" v-bind="{ store, context, formId, save, saveAndReturn, fields: availableFields, fieldComponent: EntityItemFormField }")
					form(@submit.prevent :id="formId")
						.mb-3(v-for="field in availableFields")
							entity-item-form-field(v-bind="{ field, store, context }")
			template(#actions)
				slot(name="actions" v-bind="{ submit, save, saveAndReturn, confirmAndDelete, formId }")
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
							v-if="store.itemId && store.abilities.delete"
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
import NotificationManager from '../notification';
import { ValidationError } from './adapter';
import EntityItemFormField from './entity-item-form-field.vue';
import ModalDialog from '../modal/dialogs';

let guidCounter = 0;
function guid() {
	guidCounter += 1;
	return `entity-item-${guidCounter}`;
}

export default defineComponent({
	components: { EntityItemFormField },
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
		sharedStore: {
			type: Object as PropType<EntityItemStore>,
			default: null,
		},
		context: {
			type: Object,
			default: null,
		},
		// eslint-disable-next-line vue/require-default-prop
		onReturn: Function,
		// eslint-disable-next-line vue/require-default-prop
		onDelete: Function,
	},
	emits: ['update:id', 'return', 'delete', 'change', 'update', 'create'],
	setup(props, { emit }) {
		const store = props.sharedStore || create(EntityItemStore);
		const notifier = get(NotificationManager);
		const modalDialog = get(ModalDialog);
		const initializing = ref(false);
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

		const handleErrors = async (asyncOp: Promise<void>) => {
			try {
				await asyncOp;
			} catch (err) {
				notifier.push({
					type: 'error',
					body: err instanceof ValidationError ? trans('checkValidationErrors') : `${err}`,
				});
				return false;
			}
			return true;
		};

		const saveAndNotify = async (): Promise<boolean> => {
			const result = await handleErrors(store.save());
			if (!result || store.hasErrors) {
				return false;
			}
			notifier.push({
				type: 'success',
				body: trans('successfullySaved'),
			});
			emit('change', { id: store.itemId, item: store.formItem });
			return true;
		};

		const save = async () => {
			if (!(await saveAndNotify())) {
				return;
			}
			if (props.id === store.itemId) {
				emit('update');
			} else {
				emit('create');
				emit('update:id', store.itemId);
			}
		};
		const saveAndReturn = async () => {
			if (!(await saveAndNotify())) {
				return;
			}
			emit('return', { id: store.itemId, item: store.formItem });
		};

		return {
			EntityItemFormField,
			trans,
			store,
			initializing,
			save,
			saveAndReturn,
			availableFields: computed<Required<IField>[]>(
				() =>
					props.entityMeta?.form.fields.filter<Required<IField>>(
						(field): field is Required<IField> =>
							!field.hidden &&
							(props.id ? !field.createOnly : !field.updateOnly) &&
							(!field.key || !Object.prototype.hasOwnProperty.call(props.fixedValues, field.key)),
					) || [],
			),
			async confirmAndDelete() {
				const confirmed = await modalDialog.confirm(trans('areYouSure'), trans('deleteItem'));
				if (!confirmed) {
					return;
				}
				if (await handleErrors(store.destroy())) {
					emit('delete');
					emit('return');
				}
			},
			submit() {
				if (props.onReturn) {
					saveAndReturn();
				} else {
					save();
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
		z-index 10
		border-radius .25rem
</style>
