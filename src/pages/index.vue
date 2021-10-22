<template lang="pug">
.page-index
	h1 {{ trans('homePage') }}
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import Translator from '../modules/i18n';
import { get } from '../modules/vue-composition-utils';

export default defineComponent({
	setup() {
		const trans = get(Translator);
		return {
			trans: (key: string) => trans.get(key),
		};
	},
});
</script>
