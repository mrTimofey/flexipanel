<template lang="pug">
mixin prevLink
	li.page-item(v-if="page > 1")
		a.page-link(
			@click.prevent="change(page - 1)"
			:href="makeHref(page - 1)"
		) &laquo;
	li.page-item.disabled(v-else)
		span.page-link &laquo;
mixin nextLink
	li.page-item(v-if="page < lastPage")
		a.page-link(
			@click.prevent="change(page + 1)"
			:href="makeHref(page + 1)"
		) &raquo;
	li.page-item.disabled(v-else)
		span.page-link &raquo;
mixin currentPageLink
	span.page-link(v-if="i === page" :class="{ loading }")
		span.page-link-text {{ i }}
		.spinner.spinner-border.spinner-border-sm
	a.page-link(v-else @click.prevent="change(i)" :href="makeHref(i)") {{ i }}
nav.pagination-wrapper.my-3(:class="{ loading }" v-if="lastPage > 1 || total")
	template(v-if="lastPage > 1")
		.d-none.d-sm-block: ul.pagination.pagination-sm.m-0
			+prevLink
			template(v-if="noWindow")
				li.page-item(v-for="i in lastPage" :class="{ active: page === i }")
					+currentPageLink
			template(v-else)
				template(v-if="leftWindow")
					li.page-item(v-for="i in leftWindow" :class="{ active: page === i }")
						+currentPageLink
					li.page-item.disabled: span.page-link ...
				li(v-for="i in currentWindow" :class="{ active: page === i }")
					+currentPageLink
				template(v-if="rightWindow")
					li.page-item.disabled: span.page-link ...
					li.page-item(v-for="i in rightWindow" :class="{ active: page === i }")
						+currentPageLink
			+nextLink
		.d-sm-none: ul.pagination.m-0
			+prevLink
			li.page-item.disabled
				span.page-link(:class="{ loading }")
					span.page-link-text {{ page }} / {{ lastPage }}
					.spinner.spinner-grow.spinner-grow-sm
			+nextLink
	.bg-primary.text-light.px-2.rounded(v-if="limit > 0 && total > 0")
		| {{ trans('itemsOnPage') }}
		!=': '
		span(v-if="lastPage > 1") {{ limit * (page - 1) + 1 }}-{{ page === lastPage ? total : (limit * page) }} / {{ total }}
		span(v-else) {{ total }}
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';
import Translator from '../modules/i18n';
import { get } from '../vue-composition-utils';

function range(from: number, to: number) {
	const res = [];
	for (let i = from; i <= to; i += 1) {
		res.push(i);
	}
	return res;
}

export default defineComponent({
	props: {
		page: {
			type: Number,
			required: true,
		},
		lastPage: {
			type: Number,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		total: {
			type: Number,
			default: 0,
		},
		limit: {
			type: Number,
			default: 0,
		},
	},
	emits: ['update:page', 'change'],
	setup(props, { emit }) {
		const trans = get(Translator);
		const route = useRoute();
		const hrefPrefix = computed(() => {
			const href = route.fullPath.replace(/([?&])page=[0-9]+&?/, '$1');
			if (href.endsWith('&') || href.endsWith('?')) {
				return href;
			}
			if (href.includes('?')) {
				return `${href}&`;
			}
			return `${href}?`;
		});
		const makeHref = (page: number) => (page > 1 ? `${hrefPrefix.value}page=${page}` : hrefPrefix.value.slice(0, -1));
		return {
			hrefPrefix,
			makeHref,
			noWindow: computed(() => props.lastPage < 8),
			leftWindow: computed(() => (props.page >= 5 ? [1] : false)),
			currentWindow: computed(() => {
				if (props.page < 3) {
					return range(1, 3);
				}
				if (props.page < 5) {
					return range(1, props.page + 1);
				}
				if (props.page > props.lastPage - 2) {
					return range(props.lastPage - 2, props.lastPage);
				}
				if (props.page > props.lastPage - 4) {
					return range(props.page - 1, props.lastPage);
				}
				return range(props.page - 1, props.page + 1);
			}),
			rightWindow: computed(() => (props.page <= props.lastPage - 4 ? [props.lastPage] : false)),
			change(page: number) {
				if (!props.loading) {
					emit('change', { page, href: makeHref(page) });
					emit('update:page', page);
				}
			},
			trans: (key: string) => trans.get(key),
		};
	},
});
</script>

<style scoped lang="stylus">
.pagination-wrapper
	display flex
	align-items center
	justify-content space-between
.page-link
	position relative
	&.loading .page-link-text
		color transparent
	&:not(.loading)
		.spinner
			display none
	.spinner
		position absolute
		top 0
		right 0
		bottom 0
		left 0
		margin auto
</style>
