import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://caijiahao.top',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true
    }
  }
});
