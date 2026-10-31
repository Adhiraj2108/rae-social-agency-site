// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.raesocialagency.com.au',
  // Static output: Cloudflare serves dist/ as-is (see wrangler.jsonc).
  output: 'static',
  trailingSlash: 'ignore',
  server: { port: 4321 },
  vite: {
    server: {
      strictPort: true,
      proxy: {
        // Keep Studio routes, assets, and live updates on the website's origin.
        '^/studio(?=/|[?]|$)': {
          target: 'http://127.0.0.1:3333',
          ws: true,
          bypass(request) {
            // Editor pages need the SPA entry; module requests keep their original path.
            if (request.headers.accept?.includes('text/html')) request.url = '/studio/';
          },
          rewrite: (path) => path.replace(/^\/studio(?=\?|$)/, '/studio/'),
        },
      },
    },
  },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/style-guide') }),
  ],
});
