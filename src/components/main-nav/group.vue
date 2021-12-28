<template lang="pug">
.nav-group(:class="{ expanded }")
	nav-item.btn-toggle(
		@click.prevent="switchExpanded()"
		:active="expanded"
		href="#"
	)
		template(#before)
			slot(name="before")
				nav-item-icon.caret.fas.fa-angle-right
		template(#default)
			slot
		template(#after)
			slot(name="after")
	.nav-group-children
		slot(name="children")
</template>

<script lang="ts">
import { defineComponent, ref, watchEffect } from 'vue';
import NavItem from './item.vue';
import NavItemIcon from './item-icon.vue';
import NavItemBadge from './item-badge.vue';

export default defineComponent({
	name: 'MainNavGroup',
	components: { NavItem, NavItemIcon, NavItemBadge },
	props: {
		active: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:active'],
	setup(props, { emit }) {
		const expanded = ref(props.active);

		watchEffect(() => {
			expanded.value = props.active;
		});

		return {
			expanded,
			switchExpanded() {
				expanded.value = !expanded.value;
				emit('update:active', expanded.value);
			},
		};
	},
});
</script>

<style lang="stylus" scoped>
.nav-group
	&:not(.expanded)
		.btn-toggle .caret
			transform none
		.nav-group-children
			display none
.nav-group-children
	padding-left 1rem
	margin-top 0.25rem
	animation nav-group-children-fall 0.2s ease-out
	position relative
.caret
	transform rotate(90deg)
@keyframes nav-group-children-fall
	0%
		transform translateX(-4px)
		opacity 0
	100%
		transform none
		opacity 1
</style>
