import { defineField, defineType } from 'sanity'
import { DoubleQuoteIcon } from '@sanity/icons/DoubleQuote'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: DoubleQuoteIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'testimonial', hidden: true }),
    defineField({ name: 'name', title: 'Brand name', type: 'string', description: 'Also used as the logo\'s alt text.', validation: (rule) => rule.required().max(256) }),
    defineField({ name: 'logo', title: 'Logo', type: 'image' }),
    defineField({ name: 'testimonial', title: 'Testimonial', type: 'text', rows: 4 }),
    defineField({ name: 'clientName', title: 'Client name', type: 'string', fieldset: 'client' }),
    defineField({ name: 'designation', title: 'Designation', type: 'string', fieldset: 'client' }),
  ],
  fieldsets: [{ name: 'client', title: 'Client details', options: { columns: 2 } }],
  preview: { select: { title: 'name', subtitle: 'clientName', media: 'logo' } },
})
