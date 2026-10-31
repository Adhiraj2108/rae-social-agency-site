import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'

export default defineConfig({
  name: 'default',
  title: 'Rae Social Agency',
  projectId: 'khgb3vuz',
  dataset: 'production',
  // The CLI owns /studio for dev and builds; adding it here would double the route prefix.
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
})
