import { defineField, defineType } from 'sanity'
import { PlayIcon } from '@sanity/icons/Play'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { bunnyUrl } from '../shared/fields'

export const campaign = defineType({
  name: 'campaign',
  title: 'Campaign',
  type: 'document',
  icon: PlayIcon,
  orderings: [orderRankOrdering],
  fields: [
    orderRankField({ type: 'campaign', hidden: true }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required().max(256) }),
    defineField({
      name: 'side',
      title: 'Side',
      type: 'string',
      description: 'Which side of the screen the campaign video appears on.',
      options: { list: ['Left', 'Right'], layout: 'radio', direction: 'horizontal' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'videoSrc', title: 'Video URL', type: 'url', description: 'Bunny Stream playlist, ending in /playlist.m3u8', validation: bunnyUrl }),
    defineField({ name: 'thumbnailSrc', title: 'Thumbnail URL', type: 'url', validation: bunnyUrl }),
    defineField({ name: 'instagramHandle', title: 'Instagram handle', type: 'string', description: 'Without the @' }),
    defineField({ name: 'instagramLink', title: 'Instagram link', type: 'url' }),
    defineField({ name: 'servicesProvided', title: 'Services provided', type: 'string' }),
  ],
  preview: { select: { title: 'name', subtitle: 'side' } },
})
