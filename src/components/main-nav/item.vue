<template lang="pug">
component.nav-item(
	:is="rootComponent"
	:class="{ active }"
	v-bind="rootAttrs"
)
	slot(name="before")
	span.nav-item-title
		slot
	slot(name="after")
</template>

<script lang="ts">
import type { PropType } from '@vue/runtime-core';
import { defineComponent } from '@vue/runtime-core';
import type { RouteLocationRaw, RouterLinkProps } from 'vue-router';
import { RouterLink } from 'vue-router';

export default defineComponent({
	components: { RouterLink },
	props: {
		active: {
			type: Boolean,
			default: false,
		},
		to: {
			type: [String, Object] as PropType<RouteLocationRaw>,
			default: '/',
		},
		href: {
			type: String,
			default: '',
		},
	},
	computed: {
		rootComponent() {
			return this.href ? 'a' : 'router-link';
		},
		rootAttrs() {
			if (this.href) {
				return {
					href: this.href,
				};
			}
			return {
				to: this.to,
				exactActiveClass: '',
				activeClass: '',
			} as RouterLinkProps;
		},
	},
});
</script>

<style lang="stylus" scoped>
.nav-item
	display flex
	align-items center
	text-decoration none
	color var(--bs-dark)
	padding 0.5rem
	font-size 0.8rem
	line-height 1.2
	transition background-color 0.1s ease-out
	border-radius 0.25rem
	&:hover
		background-color var(--bs-gray-200)
	&:active
		background-color var(--bs-gray-300)
	&.active
		background-color unquote('rgba(var(--bs-primary-rgb), 0.25)')
.nav-item-title
	flex 1 1 auto
</style>
