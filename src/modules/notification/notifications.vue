<template lang="pug">
transition-group.toast-container.position-fixed.start-0.end-0.top-0.my-4.mx-auto(tag="div" name="notification")
	.toast.show(
		v-for="item in store.items"
		@mouseenter="store.stopTimeout(item)"
		@mouseleave="store.startTimeout(item)"
		:class="item.type && typeClasses[item.type]"
		:key="item.id"
	)
		.toast-header.pe-5(v-if="item.title") {{ item.title }}
		button.btn-close.me-2(
			type="button"
			:class="{ 'btn-close-white': !!item.type && !item.title }"
			@click.prevent="store.close(item)"
		)
		.toast-body(v-if="item.body" :class="{ 'pe-5': !item.title }") {{ item.body }}
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
import NotificationManager from '.';
import { get } from '../vue-composition-utils';

export default defineComponent({
	setup() {
		return {
			store: get(NotificationManager),
			typeClasses: {
				error: 'bg-danger text-white border-0',
				success: 'bg-success text-white border-0',
			} as Record<string, string>,
		};
	},
});
</script>

<style lang="stylus" scoped>
.toast-container
	z-index 100
.toast
	position relative
.btn-close
	position absolute
	top 50%
	right 0
	transform translateY(-50%)
.toast-header + .btn-close
	top 1.1rem
.notification-enter-active, .notification-leave-active
	transition all 0.2s ease-out
.notification-enter-from
	opacity 0
	transform translateY(8px)
.notification-leave-to
	opacity 0
	transform translateY(-8px)
</style>
