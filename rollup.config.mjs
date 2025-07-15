import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json' with { type: 'json' };
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

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
  external: [...Object.keys(pkg.dependencies || {}), 'os', 'fs', 'path'],
  plugins: [
    nodeResolve({ extensions }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
}
