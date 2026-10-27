import { defineField, defineType } from 'sanity'
import { ThListIcon } from '@sanity/icons/ThList'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  icon: ThListIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'service', hidden: true }),
    defineField({ name: 'name', title: 'Service name', type: 'string', validation: (rule) => rule.required().max(256) }),
    defineField({ name: 'description', title: 'Description', type: 'richText' }),
  ],
  preview: { select: { title: 'name' } },
})
