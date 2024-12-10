import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
      { find: '@styles', replacement: path.resolve(__dirname, 'src/styles') },
      { find: '@constants', replacement: path.resolve(__dirname, 'src/constants') },
      { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
      { find: '@utils', replacement: path.resolve(__dirname, 'src/utils') }
    ]
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@styles/theme/_colors.scss";
          @import "@styles/theme/_shadows.scss";
          @import "@styles/theme/_animations.scss";
        `
      }
    }
  },
}); 