import {defineConfig} from "rollup";
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import styles from "rollup-plugin-styles";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import importAssets from 'rollup-plugin-import-assets';
import externalGlobals from 'rollup-plugin-external-globals';
import svgr from '@svgr/rollup'
import manifest from "./plugin.json" assert { type: 'json' }
import pkg from "./package.json" assert { type: 'json' }

export default defineConfig({
	input: './src/ts/index.tsx',
	plugins: [
		del({ targets: './dist/*', force: true }),
		typescript(),
		json(),
		styles(),
		svgr({icon: true}),
		commonjs(),
		nodeResolve({
			browser: true
		}),
		externalGlobals({
			react: 'SP_REACT',
			'react-dom': 'SP_REACTDOM',
			'@decky/ui': 'DFL',
			'@decky/manifest': JSON.stringify(manifest),
			'@decky/pkg': JSON.stringify(pkg),
		}),
		replace({
			preventAssignment: false,
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || "production"),
		}),
		importAssets({
			publicPath: `http://127.0.0.1:1337/plugins/${manifest.name}/`
		})
	],
	context: 'window',
	external: ['react', 'react-dom', '@decky/ui'],
	treeshake: {
		// Assume all external modules have imports with side effects (the default) while allowing decky libraries to treeshake
		pureExternalImports: {
			pure: ['@decky/ui', '@decky/api']
		},
		preset: 'smallest'
	},
	output: {
		dir: 'dist',
		format: 'esm',
		sourcemap: true,
		sourcemapPathTransform: (relativeSourcePath) => relativeSourcePath.replace(/^\.\.\//, `decky://decky/plugin/${encodeURIComponent(manifest.name)}/`),
		exports: 'default'
	},
})

// import commonjs from '@rollup/plugin-commonjs';
// import json from '@rollup/plugin-json';
// import {nodeResolve} from '@rollup/plugin-node-resolve';
// import replace from '@rollup/plugin-replace';
// import typescript from '@rollup/plugin-typescript';
// import {defineConfig} from 'rollup';
// import importAssets from 'rollup-plugin-import-assets';
//
// import {name} from "./plugin.json";
// import {createPathTransform} from "rollup-sourcemap-path-transform";
// import sourcemaps from "rollup-plugin-sourcemaps";
//
// const production = process.env["RELEASE_TYPE"] !== 'development'
//
// export default defineConfig({
// 	input: './src/ts/index.tsx',
// 	plugins: [
// 		commonjs(),
// 		nodeResolve({browser: true, moduleDirectories: ["node_modules"]}),
// 		typescript({sourceMap: !production, inlineSources: !production}),
// 		json(),
// 		replace({
// 			preventAssignment: false,
// 			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
// 			'process.env.RELEASE_TYPE': JSON.stringify(process.env.RELEASE_TYPE),
// 		}),
// 		importAssets({
// 			publicPath: `http://127.0.0.1:1337/plugins/${name}/`
// 		}),
// 		sourcemaps({
// 			// include: [
// 			// 	   "**frontendMain**",
// 			// 	   "**commonMain**"
// 			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/yasdpl-kt\/src\/frontendMain\/kotlin\//,
// 			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/yasdpl-kt\/src\/commonMain\/kotlin\//,
// 			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\/frontendMain\/kotlin\//,
// 			// 	   // /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/src\/commonMain\/kotlin\//
// 			// ]
// 		})
// 	],
// 	context: 'window',
// 	external: ['react', 'react-dom', 'decky-frontend-lib'],
// 	output: {
// 		file: 'dist/index.js',
// 		sourcemap: !production ? 'inline' : false,
// 		sourcemapPathTransform: !production ? createPathTransform({
// 			prefixes: {
// 				"../src/src/ts/": `/plugins/${name}/src/ts/`,
// 				"../lib/frontend/": `/plugins/${name}/lib/frontend/`,
// 				// "../../compileSync/frontend/main/productionLibrary/kotlin/": `/plugins/${name}/lib/stdlib/`,
// 				// "../../opt/teamcity-agent/work/88b0986a7186d029/atomicfu/": `/plugins/${name}/lib/atomicfu/`,
// 				// "../../mnt/agent/work/44ec6e850d5c63f0/kotlinx-coroutines-core/": `/plugins/${name}/lib/kotlinx-coroutines-core/`,
// 				// "../../mnt/agent/work/8d547b974a7be21f/ktor-io/": `/plugins/${name}/lib/ktor-io/`,
// 				"../../../../../src/frontendMain/kotlin": `/plugins/${name}/src/frontendMain/kotlin/`,
// 				"../../../../../src/commonMain/kotlin": `/plugins/${name}/src/commonMain/kotlin/`,
// 				"../../../../../../../yasdpl-kt/src/frontendMain/kotlin/": `/plugins/${name}/lib/yasdpl/src/frontendMain/kotlin/`,
// 				"../../../../../../../yasdpl-kt/src/commonMain/kotlin/": `/plugins/${name}/lib/yasdpl/src/commonMain/kotlin/`,
// 				"../node_modules/.pnpm/": `/plugins/${name}/node_modules/`
// 			},
// 			requirePrefix: false
// 		}) : undefined,
// 		footer: () => !production ? `\n//# sourceURL=http://localhost:1337/plugins/${name}/frontend_bundle` : "",
// 		globals: {
// 			react: 'SP_REACT',
// 			'react-dom': 'SP_REACTDOM',
// 			'decky-frontend-lib': 'DFL'
// 		},
// 		format: 'iife',
// 		exports: 'default',
// 		// dir: 'dist',
// 		// format: 'esm',
// 		// sourcemap: production,
// 		// sourcemapPathTransform: (relativeSourcePath) => relativeSourcePath.replace(/^\.\.\//, `decky://decky/plugin/${encodeURIComponent(name)}/`),
// 		// exports: 'default'
// 	},
// });
