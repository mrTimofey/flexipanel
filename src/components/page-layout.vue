<template lang="pug">
.page-layout
	nav.mb-4.px-3
		ol.breadcrumb
			li.breadcrumb-item
				router-link(:to="{ name: 'index' }") AdminPanel
			slot(name="breadcrumbs")
	.bg-white.shadow-sm.rounded
		slot
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({});
</script>
