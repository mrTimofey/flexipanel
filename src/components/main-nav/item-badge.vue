<template lang="pug">
.badge(:class="{ [`bg-${color}`]: true, 'rounded-pill': rounded }")
	slot
	.tooltip.bs-tooltip-top(v-if="tooltip")
		.tooltip-arrow
		.tooltip-inner {{ tooltip }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		color: {
			type: String,
			default: 'primary',
		},
		tooltip: {
			type: String,
			default: '',
		},
		rounded: Boolean,
	},
});
</script>

<style scoped lang="stylus">
.badge
	display block
	position relative
	flex none
	margin -0.2rem 0 -0.2em 0.25em
	&:hover .tooltip
		opacity 1
		transform translate(50%, 0)
.tooltip
	pointer-events none
	transform translate(50%, -2px)
	opacity 0
	transition opacity 0.1s ease-out, transform 0.1s ease-out
	right 50%
	bottom 100%
	width 140px
	margin-bottom 0.1rem
	&-arrow
		left 0
		right 0
		margin auto
</style>
