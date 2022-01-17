import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { minifyHtml } from 'vite-plugin-html';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { dependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: [
		vue(),
		minifyHtml(),
		command === 'build' &&
			dts({
				beforeWriteFile(path) {
					return {
						filePath: path.replace('/dist/src/', '/dist/'),
					};
				},
			}),
	],
	server: {
		proxy: {
			'/api': process.env.API_BACKEND || 'http://localhost:8000',
		},
	},
	build: command === 'build' && {
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			formats: ['es'],
		},
		rollupOptions: {
			external: Object.keys(dependencies),
			preserveModules: true,
			output: {
				entryFileNames(chunk) {
					if (chunk.facadeModuleId.endsWith('.vue')) {
						return `${chunk.name}.vue.js`;
					}
					if (chunk.facadeModuleId.includes('.vue?vue')) {
						return `${chunk.name.split('.vue_vue')[0]}.vue.${chunk.facadeModuleId.split('.vue?vue')[1].split('&type=')[1].split('&')[0]}.js`;
					}
					return `${chunk.name}.js`;
				},
			},
		},
	},
}));
