import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import {defineConfig} from 'rollup';
import importAssets from 'rollup-plugin-import-assets';

import {name} from "./plugin.json";
import {createPathTransform} from "rollup-sourcemap-path-transform";
import sourcemaps from "rollup-plugin-sourcemaps";

const production = process.env["RELEASE_TYPE"] !== 'development'

export default defineConfig({
	input: './src/ts/index.tsx',
	plugins: [
		commonjs(),
		nodeResolve({browser: true, moduleDirectories: ["node_modules"]}),
		typescript({sourceMap: !production, inlineSources: !production}),
		json(),
		replace({
			preventAssignment: false,
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
			'process.env.RELEASE_TYPE': JSON.stringify(process.env.RELEASE_TYPE),
		}),
		importAssets({
			publicPath: `http://127.0.0.1:1337/plugins/${name}/`
		}),
		sourcemaps({
			// include: [
			// 	   "**frontendMain**",
			// 	   "**commonMain**"
			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/yasdpl-kt\/src\/frontendMain\/kotlin\//,
			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/yasdpl-kt\/src\/commonMain\/kotlin\//,
			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\/frontendMain\/kotlin\//,
			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\/commonMain\/kotlin\//
			// ]
		})
	],
	context: 'window',
	external: ['react', 'react-dom', 'decky-frontend-lib'],
	output: {
		file: 'dist/index.js',
		sourcemap: !production ? 'inline' : false,
		sourcemapPathTransform: !production ? createPathTransform({
			prefixes: {
				"../src/src/ts/": `/plugins/${name}/src/ts/`,
				"../lib/frontend/": `/plugins/${name}/lib/frontend/`,
				// "../../compileSync/frontend/main/productionLibrary/kotlin/": `/plugins/${name}/lib/stdlib/`,
				// "../../opt/teamcity-agent/work/88b0986a7186d029/atomicfu/": `/plugins/${name}/lib/atomicfu/`,
				// "../../mnt/agent/work/44ec6e850d5c63f0/kotlinx-coroutines-core/": `/plugins/${name}/lib/kotlinx-coroutines-core/`,
				// "../../mnt/agent/work/8d547b974a7be21f/ktor-io/": `/plugins/${name}/lib/ktor-io/`,
				"../../../../../src/frontendMain/kotlin": `/plugins/${name}/src/frontendMain/kotlin/`,
				"../../../../../src/commonMain/kotlin": `/plugins/${name}/src/commonMain/kotlin/`,
				"../../../../../../../yasdpl-kt/src/frontendMain/kotlin/": `/plugins/${name}/lib/yasdpl/src/frontendMain/kotlin/`,
				"../../../../../../../yasdpl-kt/src/commonMain/kotlin/": `/plugins/${name}/lib/yasdpl/src/commonMain/kotlin/`,
				"../node_modules/.pnpm/": `/plugins/${name}/node_modules/`
			},
			requirePrefix: false
		}) : undefined,
		footer: () => !production ? `\n//# sourceURL=http://localhost:1337/plugins/${name}/frontend_bundle` : "",
		globals: {
			react: 'SP_REACT',
			'react-dom': 'SP_REACTDOM',
			'decky-frontend-lib': 'DFL'
		},
		format: 'iife',
		exports: 'default',
	},
});
