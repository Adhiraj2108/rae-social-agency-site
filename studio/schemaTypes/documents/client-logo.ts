import { defineField, defineType } from 'sanity'
import { ImagesIcon } from '@sanity/icons/Images'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

export const clientLogo = defineType({
  name: 'clientLogo',
  title: 'Client logo',
  type: 'document',
  icon: ImagesIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'clientLogo', hidden: true }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required().max(256) }),
    defineField({
      name: 'logoImage',
      title: 'Logo image',
      type: 'image',
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string', description: 'e.g. "Suze logo"' })],
    }),
  ],
  preview: { select: { title: 'name', media: 'logoImage' } },
})
