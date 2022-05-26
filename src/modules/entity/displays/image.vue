<template lang="pug">
img(:src="item[prop]" alt="" :style="{ width, height, maxHeight, maxWidth }")
</template>

<script lang="ts">
import { defineComponent } from 'vue';

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
		width: {
			type: String,
			default: null,
		},
		height: {
			type: String,
			default: null,
		},
		maxWidth: {
			type: String,
			default: null,
		},
		maxHeight: {
			type: String,
			default: null,
		},
	},
});
</script>
