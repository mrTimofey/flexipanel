<template lang="pug">
span {{ index + offset }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	inheritAttrs: false,
	props: {
		index: {
			type: Number,
			required: true,
		},
		offset: {
			type: Number,
			default: 1,
		},
	},
});
</script>
