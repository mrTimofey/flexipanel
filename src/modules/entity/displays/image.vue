<template lang="pug">
img(:src="src" alt="")
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useTemplate } from '../../vue-composition-utils';

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
		urlTemplate: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const { tpl } = useTemplate();
		return {
			src: computed(() => props.item[props.prop] && (props.urlTemplate ? tpl(props.urlTemplate, props.item[props.prop]) : props.item[props.prop])),
		};
	},
});
</script>
