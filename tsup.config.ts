import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.{ts,js}'],
  format: ['esm'],
  clean: true,
  dts: false,
  outDir: 'dist'
});
