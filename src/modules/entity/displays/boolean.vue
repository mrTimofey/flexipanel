<template lang="pug">
.display-boolean
	i(:class="iconClass")
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';

export default defineComponent({
	props: {
		item: {
			type: Object,
			required: true,
		},
		prop: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		return {
			iconClass: computed(() => {
				if (props.item[props.prop] === true) {
					return 'fa-solid fa-check text-success';
				}
				if (props.item[props.prop] === false) {
					return 'fa-solid fa-times text-muted';
				}
				return 'fa-solid fa-question';
			}),
		};
	},
});
</script>

<style lang="stylus" scoped>
.display-boolean
	width 1.5rem
	text-align center
</style>
