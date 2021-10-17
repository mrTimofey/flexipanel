<template lang="pug">
.content(v-if="items && items.length" :class="{ loading }")
	ul.list-group
		li.list-group-item(v-for="item in items")
			span(v-html="tmpl(item)")
</template>

<script lang="ts">
import type { PropType } from 'vue';
import { defineComponent } from 'vue';
import { get } from '../../../vue-composition-utils';
import TemplateEngine from '../../template';

export interface IColumn {
	title: string;
	key: string;
}

export default defineComponent({
	props: {
		items: {
			type: Array as PropType<Record<string, unknown>[]>,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		displayTemplate: {
			type: String,
			default: '{{=it.id}}',
		},
	},
	emits: ['reload'],
	setup(props) {
		const tmpl = get(TemplateEngine);
		return {
			tmpl(data: unknown): string {
				return tmpl.exec(props.displayTemplate, data);
			},
		};
	},
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
