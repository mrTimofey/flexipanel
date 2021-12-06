<template lang="pug">
.entity-view-display-html(v-html="template ? tpl(template, item) : item[prop]")
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core';
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

<style lang="stylus" scoped>
.entity-view-display-html
	::v-deep(img), ::v-deep(svg)
		max-width 100%
		max-height 100%
</style>
