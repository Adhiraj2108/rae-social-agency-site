// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.raesocialagency.com.au',
  // Static output: Cloudflare serves dist/ as-is (see wrangler.jsonc).
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({ filter: (page) => !page.includes('/style-guide') }),
  ],
});
