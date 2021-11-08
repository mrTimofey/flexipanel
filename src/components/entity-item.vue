<template lang="pug"></template>

<script lang="ts">
import { defineComponent, computed, watchEffect } from '@vue/runtime-core';
import EntityManager from '../modules/entity';
import EntityItemStore from '../modules/entity/stores/item';
import { get, create } from '../modules/vue-composition-utils';

export default defineComponent({
	props: {
		entity: {
			type: String,
			required: true,
		},
		id: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const entityManager = get(EntityManager);
		const entityMeta = computed(() => entityManager.getEntity(props.entity));
		const store = create(EntityItemStore);

		watchEffect(() => {
			store.loadEntityItem(entityMeta.value, props.id);
		});

		return {
			entityMeta,
		};
	},
});
</script>
