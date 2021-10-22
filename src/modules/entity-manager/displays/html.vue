<template lang="pug">
div(v-html="template ? tpl(template, item) : item[prop]")
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
		template: {
			type: String,
			default: '',
		},
	},
	setup() {
		return useTemplate();
	},
});
</script>
