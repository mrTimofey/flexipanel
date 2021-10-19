<template lang="pug">
.page-entity-view
	entity-view(
		:entity="entity"
		:view="view"
		v-model:page="page"
	)
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouteQueryParam } from '../vue-composition-utils';
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
		return {
			page: useRouteQueryParam('page', 1),
		};
	},
});
</script>

<style lang="stylus" scoped>
.spinner
	width 9.5rem
	height @width
</style>
