<template lang="pug">
.form-field-editorjs
	slot(name="label")
	div(ref="editorElement" :class="{ 'is-invalid': !!errors }")
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { onBeforeUnmount, defineComponent, ref, watch } from 'vue';
import type { EditorConfig, OutputData } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import { getCommonProps } from './common';

export type EditorComponentConfig = Omit<EditorConfig, 'holder' | 'data' | 'placeholder' | 'onChange'>;

export default defineComponent({
	props: {
		...getCommonProps({
			type: Object as PropType<OutputData>,
			default: null,
		}),
		config: {
			type: Object as PropType<EditorComponentConfig>,
			default: () => ({}),
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const editorElement = ref<null | HTMLDivElement>();
		let editor: EditorJS | null = null;
		let justEmitted = false;

		const emitChange = (data: OutputData) => {
			// catch internal change
			justEmitted = true;
			emit('update:modelValue', data.blocks.length ? data : null);
		};

		watch(
			[editorElement, () => props.config],
			() => {
				if (editor) {
					editor.destroy();
					editor = null;
				}
				if (!editorElement.value) {
					return;
				}
				editor = new EditorJS({
					holder: editorElement.value,
					data: props.modelValue?.blocks?.length ? props.modelValue : undefined,
					placeholder: props.placeholder,
					readOnly: props.disabled,
					onChange() {
						editor?.save().then(emitChange);
					},
					onReady() {
						// for custom events from custom tools
						editor?.on('change', () => {
							editor?.save().then(emitChange);
						});
					},
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore enum object is undefined because of esbuild so hardcode the value
					logLevel: 'ERROR',
					...props.config,
				});
			},
			{ immediate: true },
		);
		watch(
			() => props.disabled,
			() => {
				if (!editor) {
					return;
				}
				editor.readOnly.toggle(props.disabled);
			},
		);
		watch(
			() => props.modelValue,
			() => {
				if (!editor || justEmitted || props.modelValue === undefined) {
					// catch internal change
					justEmitted = false;
					return;
				}
				editor.render(props.modelValue);
			},
		);
		onBeforeUnmount(() => {
			editor?.destroy();
		});
		return {
			editorElement,
		};
	},
});
</script>
