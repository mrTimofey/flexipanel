<template lang="pug">
.form-field-array
	.form-field-array-label
		slot(name="label")
	.rounded(v-if="keys && valueLength > 0" :class="errors ? 'bg-danger' : ''" style="--bs-bg-opacity:0.25")
		.d-flex.align-items-center.my-1(v-for="num in valueLength" :key="keys[num - 1]")
			.flex-grow-1
				component(
					:is="fieldComponent(type)"
					v-bind="props"
					:entity="entity"
					:entity-item="entityItem"
					:entity-item-id="entityItemId"
					:related-items="relatedItems"
					:field-key="fieldKey"
					:model-value="modelValue && modelValue[num - 1] || null"
					:disabled="disabled"
					@update:model-value="updateItem(num - 1, $event)"
				)
			.actions.ms-1(v-if="!length && valueLength > min")
				button.btn.btn-sm.btn-danger(
					type="button"
					@click.prevent="removeItem(num - 1)"
					:disabled="disabled"
				)
					i.fa-solid.fa-trash
	button.btn.btn-sm.btn-primary.mt-1(
		v-if="!length && valueLength < max"
		type="button"
		:disabled="disabled"
		@click.prevent="addItem()"
	)
		i.fa-solid.fa-plus
		!=' {{ addLabel }}'
	.text-danger(v-if="errors && errors.length")
		div(v-for="err in errors")
			small {{ err }}
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, computed, ref, watch } from '@vue/runtime-core';
import EntityManager from '..';
import { get } from '../../vue-composition-utils';

let idCounter = 0;
function uid() {
	idCounter += 1;
	return idCounter;
}

export default defineComponent({
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
		entity: {
			type: String,
			default: '',
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
		addLabel: {
			type: String,
			default: '',
		},
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const entityManager = get(EntityManager);
		const keys = ref<number[] | null>(null);
		const valueLength = computed(() => {
			if (props.length) {
				return props.length;
			}
			return Math.max(props.modelValue ? props.modelValue.length : 0, props.min);
		});
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
			keys,
			valueLength,
			fieldComponent(type: string) {
				return entityManager.getFieldType(type)?.component;
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
				do {
					value.push(props.defaultItemValue);
					newKeys.push(uid());
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
		};
	},
});
</script>
