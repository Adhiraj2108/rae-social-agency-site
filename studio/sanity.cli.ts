import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'khgb3vuz',
    dataset: 'production',
  },
  // Owns the Studio's top-level route in both development and production builds.
  project: {
    basePath: '/studio',
  },
  server: { hostname: '127.0.0.1', port: 3333 },
  vite: (config) => ({
    ...config,
    server: {
      ...config.server,
      // npm run dev exposes Studio through Astro, including its live-update socket.
      ...(process.env.RAE_STUDIO_PROXY_PORT ? {
        ws: { ...config.server?.ws, clientPort: Number(process.env.RAE_STUDIO_PROXY_PORT) },
      } : {}),
    },
  }),
  deployment: {
    appId: 'moo1n99tilkyyp0g9d7g57eh',
    // Off: the Studio is bundled into the site build instead of loading Sanity's code from their CDN
    // (the build hung fetching it). Update Studio by bumping `sanity` in studio/package.json.
    autoUpdates: false,
  },
  studioHost: 'raesocialagency',
})
