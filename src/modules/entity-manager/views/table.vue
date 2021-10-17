<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	table.table.table-sm
		thead
			tr
				th(v-for="{ title } in columns") {{ title }}
		tbody
			tr(v-for="item in items")
				td(v-for="field in columns") {{ item[field.key] }}
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

export interface IColumn {
	title: string;
	key: string;
}

export default defineComponent({
	props: {
		columns: {
			type: Array as PropType<IColumn[]>,
			required: true,
		},
		items: {
			type: Array as PropType<Record<string, unknown>[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['reload'],
});
</script>

<style lang="stylus" scoped>
.content
	position relative
.loading::before
	content ''
	display block
	position absolute
	top -0.5rem
	right @top
	bottom @top
	left @top
	opacity 0.8
	background white
	z-index 5
</style>
