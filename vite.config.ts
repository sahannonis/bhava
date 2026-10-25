import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` makes the app for Android (dist/, loaded by Capacitor).
// `npm run build:preview` makes one page with everything inside it except the places list,
// which stays a file beside it (preview/assets/places-*.bin), for a quick look in a browser.
export default defineConfig(({ mode }) => {
  const preview = mode === 'preview';
  return {
    base: './',
    plugins: preview ? [viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true })] : [],
    build: {
      target: 'es2022',
      outDir: preview ? 'preview' : 'dist',
      cssCodeSplit: !preview,
      assetsInlineLimit: preview ? (file: string) => !file.endsWith('.bin') : 4096,
      rollupOptions: preview ? { output: { inlineDynamicImports: true } } : undefined,
    },
  };
});
