import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { minifyHtml } from 'vite-plugin-html';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { dependencies } from './package.json';

const plugins = [vue(), minifyHtml()];

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: command === 'build' ? [...plugins, dts()] : plugins,
	server: {
		proxy: {
			'/api': process.env.API_BACKEND || 'http://localhost:8000',
		},
	},
	build: command === 'build' && {
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			name: 'VueAdmin',
		},
		rollupOptions: {
			external: Object.keys(dependencies),
			output: [
				{
					format: 'esm',
				},
				{
					format: 'umd',
					inlineDynamicImports: true,
					exports: 'named',
				},
			],
		},
	},
}));
