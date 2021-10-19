<template lang="pug">
.page-entity-view
	entity-view(
		:entity="entity"
		:view="view"
		v-model:page="page"
	)
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import EntityView from '../components/entity-view.vue';

export default defineComponent({
	components: { EntityView },
	props: {
		entity: {
			type: String,
			required: true,
		},
		view: {
			type: String,
			default: '',
		},
	},
	setup() {
		const route = useRoute();
		const router = useRouter();
		const page = computed({
			get() {
				return parseInt(route.query.page?.toString() || '1', 10) || 1;
			},
			set(newPage: number) {
				const query = { ...route.query };
				if (newPage === 1) {
					delete query.page;
				} else {
					query.page = newPage.toString();
				}
				router.replace({ query });
			},
		});
		return {
			page,
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
</style>
