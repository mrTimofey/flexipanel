<template lang="pug">
modal-dialog(
	v-if="store.body"
	@close="store.answer()"
	@action-click="store.answer($event.index)"
	size="sm"
	:title="store.title"
	:actions="store.actions"
) {{ store.body }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ModalDialog from './modal.vue';
import ModalDialogStore from './dialogs';
import { get } from '../vue-composition-utils';

export default defineComponent({
	components: { ModalDialog },
	setup() {
		const store = get(ModalDialogStore);
		return {
			store,
		};
	},
});
</script>
