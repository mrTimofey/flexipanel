import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { createHtmlPlugin } from 'vite-plugin-html';
import { dependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		createHtmlPlugin(),
		// remove an unused hack file, see src/__import-all.js for details
		{
			name: 'flexipanel:remove-import-all',
			generateBundle(options, bundle) {
				delete bundle['__import-all.js'];
			},
		},
	],
	build: {
		lib: {
			entry: 'src/main.ts',
			formats: ['es'],
		},
		rollupOptions: {
			external: Object.keys(dependencies),
			output: {
				// remove src prefix in output file paths
				preserveModulesRoot: 'src',
				preserveModules: true,
				// Rename emitted Vue component sources so they named `[name].vue.js`.
				// It is a convenient way to allow applications importing them like '.../name.vue' when using bundlers.
				// Also `.d.ts` files are generated as `[name].vue.d.ts` so we do not need to tweak them - everything just works.
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
});
