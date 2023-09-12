import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createHtmlPlugin } from 'vite-plugin-html';
import { resolve } from 'path';
import { dependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: [
		vue(),
		createHtmlPlugin(),
		...(command === 'build'
			? [
					{
						name: 'flexipanel:remove-import-all',
						generateBundle(options, bundle) {
							delete bundle['__import-all.js'];
							const main = bundle['main.js'];
							if (main.type !== 'chunk') {
								return;
							}
							main.code = main.code.replace('export { default as __dontUseThisThankYou__ } from "./__import-all.js";', '');
						},
					},
			  ]
			: []),
	],
	server: {
		proxy: {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			'/api': process.env.API_BACKEND || 'http://localhost:8000',
		},
	},
	...(command === 'build' && {
		build: {
			lib: {
				entry: resolve(__dirname, 'src/main.ts'),
				formats: ['es'],
			},
			rollupOptions: {
				external: Object.keys(dependencies),
				preserveModules: true,
				output: {
					preserveModulesRoot: 'src',
					entryFileNames(chunk) {
						if (chunk.facadeModuleId?.endsWith('.vue')) {
							return `${chunk.name}.vue.js`;
						}
						if (chunk.facadeModuleId?.includes('.vue?vue')) {
							return `${chunk.name.split('.vue_vue')[0]}.vue.${chunk.facadeModuleId.split('.vue?vue')[1].split('&type=')[1].split('&')[0]}.js`;
						}
						return `${chunk.name}.js`;
					},
				},
			},
		},
	}),
}));
