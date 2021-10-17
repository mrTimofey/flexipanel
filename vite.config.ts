import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { minifyHtml } from 'vite-plugin-html';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), minifyHtml()],
});
