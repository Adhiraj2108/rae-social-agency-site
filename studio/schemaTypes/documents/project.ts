import { defineArrayMember, defineField, defineType } from 'sanity'
import { CaseIcon } from '@sanity/icons/Case'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { bunnyUrl } from '../shared/fields'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: CaseIcon,
  groups: [
    { name: 'info', title: 'Info', default: true },
    { name: 'video', title: 'Main video' },
    { name: 'more', title: 'More reels' },
  ],
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'project', hidden: true }),
    defineField({ name: 'name', title: 'Project name', type: 'string', group: 'info', validation: (rule) => rule.required().max(256) }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'info',
      description: 'Used in the link that opens this project: raesocialagency.com/#slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'clientName', title: 'Client name', type: 'string', group: 'info' }),
    defineField({ name: 'servicesProvided', title: 'Services provided', type: 'string', group: 'info' }),
    defineField({ name: 'description', title: 'Short description', type: 'richText', group: 'info' }),
    defineField({ name: 'brief', title: 'Brief', type: 'text', rows: 3, group: 'info', description: 'Shown on the project card and under "Client Brief" in the project drawer.' }),
    defineField({ name: 'approach', title: 'Approach', type: 'text', rows: 3, group: 'info', description: 'Shown in the project drawer under "Our Approach".' }),
    defineField({ name: 'results', title: 'Results', type: 'richText', group: 'info' }),
    defineField({ name: 'credits', title: 'Credits', type: 'richText', group: 'info' }),
    defineField({ name: 'videoSrc', title: 'Video URL', type: 'url', group: 'video', description: 'Bunny Stream playlist, ending in /playlist.m3u8', validation: bunnyUrl }),
    defineField({ name: 'thumbnailUrl', title: 'Thumbnail URL', type: 'url', group: 'video', description: 'Full Bunny thumbnail URL.', validation: bunnyUrl }),
    defineField({
      name: 'moreVideos',
      title: 'More reels',
      type: 'array',
      group: 'more',
      description: 'Up to five reels for the "More from" carousel in the project drawer.',
      of: [defineArrayMember({ type: 'reel' })],
      validation: (rule) => rule.max(5),
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'clientName' } },
})
