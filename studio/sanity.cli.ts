import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'khgb3vuz',
    dataset: 'production',
  },
  // Built into the site's dist/studio and served at /studio (also set as basePath in sanity.config.ts)
  project: {
    basePath: '/studio',
  },
  deployment: {
    appId: 'moo1n99tilkyyp0g9d7g57eh',
    // Off: the Studio is bundled into the site build instead of loading Sanity's code from their CDN
    // (the build hung fetching it). Update Studio by bumping `sanity` in studio/package.json.
    autoUpdates: false,
  },
  studioHost: 'raesocialagency',
})
