import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { minifyHtml } from 'vite-plugin-html';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { unlinkSync } from 'fs';
import { dependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: [
		vue(),
		minifyHtml(),
		...(command === 'build'
			? [
					dts({
						beforeWriteFile(path, content) {
							const filePath = path.replace('/dist/src/', '/dist/');
							if (path.endsWith('/dist/src/main.d.ts')) {
								return {
									content: content.replace("export { default as __dontUseThisThankYou__ } from './__import-all';", ''),
									filePath,
								};
							}
							return { filePath };
						},
						afterBuild() {
							unlinkSync(resolve(__dirname, 'dist/__import-all.d.ts'));
						},
					}),
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
