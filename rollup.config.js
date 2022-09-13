import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      inlineDynamicImports: true,
    },
    {
      file: pkg.module,
      format: 'esm',
      inlineDynamicImports: true,
    },
  ],
  external: [...Object.keys(pkg.dependencies || {}), 'os', 'fs', 'path', 'is-svg', 'execa'],
  plugins: [resolve(), commonjs(), typescript({ tsconfig: './tsconfig.json' })],
}
