<template lang="pug">
teleport(to="body")
	.modal(style="display:block" @click="onClick")
		.modal-dialog(:class="{ [`modal-${size}`]: !!size }" @click="markClickAsInside")
			.modal-content
				slot(name="header")
					.modal-header(v-if="title")
						h5.modal-title {{ title }}
						button.btn-close(@click="onCloseClick")
				.modal-body
					slot
				slot(name="footer")
					.modal-footer(v-if="actions && actions.length")
						button.btn(
							v-for="(action, index) in actions"
							:ref="index === 0 ? 'firstActionButton' : undefined"
							:class="`btn-${action.type}`"
							@click.prevent="onActionClick(action, index)"
						) {{ action.title }}
</template>
<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent, onMounted, onBeforeUnmount, ref, watch } from '@vue/runtime-core';

const clickInside = Symbol('modalClickInsideMarker');
type MarkedMouseEvent = MouseEvent & { [clickInside]?: true };

export type ModalSize = 'sm' | 'lg' | 'xl';

export interface IModalAction {
	type: 'primary' | 'secondary' | 'info' | 'warning' | 'danger' | 'light' | 'dark' | 'success';
	title: string;
}

export default defineComponent({
	props: {
		size: {
			type: String as PropType<ModalSize>,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		actions: {
			type: Array as PropType<IModalAction[]>,
			default: null,
		},
	},
	emits: ['background-click', 'close-click', 'action-click', 'escape-press', 'close'],
	setup(props, { emit }) {
		const firstActionButton = ref<HTMLButtonElement | null>(null);

		function onKeyPress(e: KeyboardEvent) {
			if (e.key === 'Escape' || e.key === 'Esc') {
				emit('escape-press');
				emit('close');
			}
		}
		onMounted(() => {
			window.addEventListener('keydown', onKeyPress);
		});
		onBeforeUnmount(() => {
			window.removeEventListener('keydown', onKeyPress);
		});
		// focus first action on modal open
		const stopWatchFirstActionButton = watch(firstActionButton, () => {
			firstActionButton.value?.focus();
			stopWatchFirstActionButton();
		});
		return {
			firstActionButton,
			markClickAsInside(e: MarkedMouseEvent) {
				e[clickInside] = true;
			},
			onClick(e: MarkedMouseEvent) {
				if (!e[clickInside]) {
					emit('background-click');
					emit('close');
				}
			},
			onCloseClick() {
				emit('close-click');
				emit('close');
			},
			onActionClick(action: IModalAction, index: number) {
				emit('action-click', { action, index });
			},
		};
	},
});
</script>
<style lang="stylus" scoped>
.modal
	background rgba(black, 0.5)
	animation modal-appear 0.1s ease-out
.modal-dialog
	animation modal-dialog-fall 0.2s ease-out
@keyframes modal-appear
	0%
		opacity 0
	100%
		opacity 1
@keyframes modal-dialog-fall
	0%
		transform translateY(-8px)
	100%
		transform none
</style>