<template lang="pug">
modal-dialog(
	v-if="store.body"
	@close="store.closeWithAnswer()"
	@action-click="store.closeWithAnswer($event.index)"
	:size="store.size"
	:title="store.title"
	:actions="store.actions"
)
	template(v-if="typeof store.body === 'string'") {{ store.body }}
	component(
		v-else
		:is="store.body"
		v-bind="store.props"
	)
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ModalDialog from './modal.vue';
import Store from './dialogs';
import { get } from '../vue-composition-utils';

export default defineComponent({
	name: 'ModalDialogsContainer',
	components: { ModalDialog },
	setup() {
		const store = get(Store);
		return {
			store,
		};
	},
});
</script>
