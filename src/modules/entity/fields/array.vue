<template lang="pug">
mixin addButton(condition)
	button.btn.btn-sm.btn-primary.my-1.form-field-array-add-button(
		v-if=`!length && valueLength < max && ${condition}`
		type="button"
		:disabled="disabled"
		@click.prevent="addItem()"
	)
		i.fa-solid.fa-plus
		!=' {{ addButtonLabel }}'
.form-field-array
	.form-field-array-label
		slot(name="label")
	+addButton('["both", "top"].includes(addButtonPosition)')
	draggable-group.form-field-array-items(
		v-if="keys && valueLength > 0"
		style="--bs-bg-opacity:0.25"
		item-key="key"
		handle="[data-move-handle]"
		:class="errors ? 'bg-danger' : ''"
		:model-value="keyedItems"
		:disabled="!sortable || disabled"
		@change="$event.moved && changePosition($event.moved.oldIndex, $event.moved.newIndex)"
	)
		template(#item="{ element: { value }, index }")
			.d-flex.align-items-center.my-1(
				:style="tpl(itemStyle, { value, index })"
				:class="tpl(itemClass, { value, index })"
			)
				button.btn.btn-light.btn-sm.drag-action.me-1(
					v-if="valueLength > 1 && !disabled && sortable"
					@click.prevent
					data-move-handle
				)
					i.fa-solid.fa-arrows-alt-v
				.flex-grow-1
					entity-item-form-field(
						v-if="store"
						:field="getFieldDefinition(index)"
						:store="store"
						@change="updateItem(index, $event)"
					)
				.actions.ms-1(v-if="!length && valueLength > min")
					button.btn.btn-sm.btn-danger(
						type="button"
						@click.prevent="removeItem(index)"
						:disabled="disabled"
					)
						i.fa-solid.fa-trash
	+addButton('["both", "bottom"].includes(addButtonPosition)')
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { inject, defineComponent, computed, ref, watch } from '@vue/runtime-core';
import DraggableGroup from 'vuedraggable';
import type { IField, IRegisteredEntity } from '..';
import { useTemplate } from '../../vue-composition-utils';
import EntityItemFormField, { storeInjectKey } from '../entity-item-form-field.vue';

let idCounter = 0;
function uid() {
	idCounter += 1;
	return idCounter;
}

export default defineComponent({
	components: { DraggableGroup, EntityItemFormField },
	props: {
		modelValue: {
			type: Array as PropType<unknown[]>,
			default: () => [],
		},
		fieldKey: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		relatedItems: {
			type: Object as PropType<Record<string, Record<string, Record<string, unknown>>>>,
			default: () => ({}),
		},
		entityMeta: {
			type: Object as PropType<IRegisteredEntity>,
			default: null,
		},
		entityItem: {
			type: Object,
			default: null,
		},
		entityItemId: {
			type: String,
			default: '',
		},
		type: {
			type: String,
			default: 'text',
		},
		props: {
			type: Object as PropType<Record<string, unknown>>,
			default: () => ({}),
		},
		defaultItemValue: {
			type: [Number, String, Boolean, Object] as PropType<unknown>,
			default: null,
		},
		length: {
			type: Number,
			default: 0,
		},
		min: {
			type: Number,
			default: 0,
		},
		max: {
			type: Number,
			default: Infinity,
		},
		addButtonLabel: {
			type: String,
			default: '',
		},
		addButtonPosition: {
			type: String as PropType<'top' | 'bottom' | 'both'>,
			default: 'bottom',
		},
		unshift: {
			type: Boolean,
			default: false,
		},
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
		sortable: {
			type: Boolean,
			default: false,
		},
		itemStyle: {
			type: String,
			default: '',
		},
		itemClass: {
			type: String,
			default: '',
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const keys = ref<number[] | null>(null);
		const valueLength = computed(() => {
			if (props.length) {
				return props.length;
			}
			return Math.max(props.modelValue ? props.modelValue.length : 0, props.min);
		});
		const items = computed<unknown[]>(() => {
			if (!props.modelValue) {
				return Array(valueLength.value).fill(props.defaultItemValue);
			}
			const diff = valueLength.value - (props.modelValue?.length || 0);
			if (diff <= 0) {
				return props.modelValue;
			}
			return [...props.modelValue, ...Array(diff).fill(props.defaultItemValue)];
		});
		const keyedItems = computed<{ value: unknown; key: ReturnType<typeof uid> }[]>(() =>
			items.value.map((value, i) => ({
				value,
				key: (keys.value && keys.value[i]) || -1,
			})),
		);
		let internalInput = false;

		watch(
			() => props.modelValue,
			() => {
				if (!internalInput || !keys.value) {
					const newKeys: number[] = [];
					while (newKeys.length !== valueLength.value) {
						newKeys.push(uid());
					}
					keys.value = newKeys;
				}
				internalInput = false;
			},
			{ immediate: true },
		);

		const emitInternal = (v: unknown[]) => {
			internalInput = true;
			emit('update:modelValue', v);
		};

		return {
			...useTemplate(),
			keys,
			valueLength,
			keyedItems,
			store: inject(storeInjectKey),
			getFieldDefinition(index: number): Required<IField> {
				return {
					type: props.type || 'text',
					key: `${props.fieldKey}.${index}`,
					label: '',
					inlineRelated: false,
					hidden: false,
					createProps: {},
					updateProps: {},
					props: { ...props.props, disabled: props.disabled },
				};
			},
			updateItem(i: number, v: unknown) {
				if (props.disabled) {
					return;
				}
				let value = props.modelValue ? [...props.modelValue] : [];
				if (props.length && value.length !== props.length) {
					const newValue = [];
					for (let k = 0; k < props.length; k += 1) {
						newValue[i] = value[i] == null ? props.defaultItemValue : value[i];
					}
					value = newValue;
				} else {
					while (value.length < props.min) {
						value.push(props.defaultItemValue);
					}
					if (value.length > props.max) {
						value.length = props.max;
					}
				}
				if (i < value.length) {
					value[i] = v;
				}
				emitInternal(value);
			},
			addItem() {
				if (props.disabled) {
					return;
				}
				const value = props.modelValue ? [...props.modelValue] : [];
				const newKeys: number[] = keys.value?.slice() || [];
				const addOp = props.unshift ? 'unshift' : 'push';
				do {
					value[addOp](props.defaultItemValue);
					newKeys[addOp](uid());
				} while (value.length <= props.min);
				keys.value = newKeys;
				emitInternal(value);
			},
			removeItem(i: number) {
				if (props.disabled) {
					return;
				}
				const value = [...props.modelValue];
				const newKeys: number[] = keys.value?.slice() || [];
				newKeys.splice(i, 1);
				value.splice(i, 1);
				keys.value = newKeys;
				emitInternal(value);
			},
			changePosition(oldIndex: number, newIndex: number) {
				if (oldIndex === newIndex) {
					return;
				}
				const newValue = items.value.slice();
				const newKeys = keys.value?.slice() || [];
				newValue.splice(oldIndex, 1);
				newValue.splice(newIndex, 0, items.value[oldIndex]);
				newKeys.splice(oldIndex, 1);
				newKeys.splice(newIndex, 0, keys.value?.[oldIndex] || uid());
				emitInternal(newValue);
				keys.value = newKeys;
			},
		};
	},
});
</script>
