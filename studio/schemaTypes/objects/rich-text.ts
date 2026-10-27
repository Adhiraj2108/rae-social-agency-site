import { defineArrayMember, defineType } from 'sanity'
import { BlockContentIcon } from '@sanity/icons/BlockContent'

// Paragraphs with bold, italic and links: what the Webflow rich text fields used.
export const richText = defineType({
  name: 'richText',
  title: 'Rich text',
  type: 'array',
  icon: BlockContentIcon,
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Normal', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{ name: 'href', type: 'url', title: 'URL', validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto'] }) }],
          },
        ],
      },
    }),
  ],
})
