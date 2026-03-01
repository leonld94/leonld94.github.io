import { defineConfig } from 'vite';
import markdownPostsPlugin from './vite-plugin-markdown-posts.js';

export default defineConfig({
  base: '/sungho/',
  plugins: [markdownPostsPlugin()],
  server: {
    port: 5173,
    open: false,
  },
});
