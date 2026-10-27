import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'khgb3vuz',
    dataset: 'production',
  },
  deployment: {
    appId: 'moo1n99tilkyyp0g9d7g57eh',
    autoUpdates: true,
  },
  studioHost: 'raesocialagency',
})
