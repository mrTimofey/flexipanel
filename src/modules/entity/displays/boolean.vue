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
		trueClass: {
			type: String,
			default: 'fas fa-check text-success',
		},
		falseClass: {
			type: String,
			default: 'fas fa-times text-muted',
		},
		nullClass: {
			type: String,
			default: 'fas fa-question',
		},
	},
	setup(props) {
		return {
			iconClass: computed(() => {
				if (props.item[props.prop] == null) {
					return props.nullClass;
				}
				return props.item[props.prop] ? props.trueClass : props.falseClass;
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
