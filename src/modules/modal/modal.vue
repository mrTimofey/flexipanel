<template lang="pug">
teleport(to="body")
	.modal(
		style="display:block"
		@mousedown="onPointerPressStart($event.clientX, $event.clientY, $event)"
		@touchstart="onPointerPressStart($event.touches[0].clientX, $event.touches[0].clientY, $event)"
		@mouseup="onPointerPressEnd($event.clientX, $event.clientY)"
		@touchend="onPointerPressEnd($event.touches[0].clientX, $event.touches[0].clientY)"
	)
		.modal-dialog(
			:class="{ [`modal-${size}`]: !!size }"
			@mousedown="markPointerEventAsInside($event)"
			@touchstart="markPointerEventAsInside($event)"
		)
			.modal-content
				slot(name="header")
					.modal-header(v-if="title")
						h5.modal-title {{ title }}
						button.btn-close(@click="onCloseClick")
				.modal-body(v-bind="$attrs")
					slot
				slot(name="footer")
					.modal-footer(v-if="actions && actions.length")
						button.btn(
							v-for="(action, index) in actions"
							:class="`btn-${action.type}`"
							@click.prevent="onActionClick(action, index)"
						) {{ action.title }}
</template>
<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent, onMounted, onBeforeUnmount } from 'vue';
import type { IModalAction, ModalSize } from '.';

const clickInside = Symbol('modalClickInsideMarker');
type MarkedPointerEvent = Event & { [clickInside]?: true };

export default defineComponent({
	name: 'ModalDialog',
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
		const pointerPosition = { x: -1, y: -1 };

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
		return {
			onCloseClick() {
				emit('close-click');
				emit('close');
			},
			onActionClick(action: IModalAction, index: number) {
				emit('action-click', { action, index });
			},
			markPointerEventAsInside(e: MarkedPointerEvent) {
				e[clickInside] = true;
			},
			onPointerPressStart(x: number, y: number, e: MarkedPointerEvent) {
				if (!e[clickInside]) {
					pointerPosition.x = x;
					pointerPosition.y = y;
				}
			},
			onPointerPressEnd(x: number, y: number) {
				if (pointerPosition.x > 0 && Math.abs(pointerPosition.x - x) < 4 && Math.abs(pointerPosition.y - y) < 4) {
					emit('background-click');
					emit('close');
				}
				pointerPosition.x = -1;
				pointerPosition.y = -1;
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
