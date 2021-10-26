<template lang="pug">
img(:src="item[prop]" alt="")
</template>

<script lang="ts">
import { defineComponent } from 'vue';
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
	},
	setup() {
		return useTemplate();
	},
});
</script>
