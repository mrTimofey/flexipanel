<template lang="pug">
.form-field-editorjs
	slot(name="label")
	div(ref="editorElement")
	.invalid-feedback(v-if="errors && errors.length")
		div(v-for="err in errors") {{ err }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, ref, watch } from 'vue';
import type { EditorConfig, OutputData } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';

export type EditorComponentConfig = Omit<EditorConfig, 'holder' | 'data' | 'placeholder' | 'onChange'>;

export default defineComponent({
	props: {
		modelValue: {
			type: Object as PropType<OutputData>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
		errors: {
			type: Array as PropType<string[]>,
			default: null,
		},
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
					data: props.modelValue,
					placeholder: props.placeholder,
					readOnly: props.disabled,
					onChange() {
						editor?.save().then((data) => {
							justEmitted = true;
							emit('update:modelValue', data);
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
				if (!editor || justEmitted) {
					justEmitted = false;
					return;
				}
				editor.render(props.modelValue);
			},
		);
		return {
			editorElement,
		};
	},
});
</script>
