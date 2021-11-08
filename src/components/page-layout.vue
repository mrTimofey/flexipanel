<template lang="pug">
.page-layout
	nav.mb-4.px-3
		ol.breadcrumb
			li.breadcrumb-item
				router-link(:to="{ name: 'index' }") AdminPanel
			slot(name="breadcrumbs")
	.bg-white.shadow-sm.rounded
		.px-3.pt-3.mb-3
			h1
				slot(name="title") use template(#title) to add page title
			slot(name="header")
		slot
</template>
