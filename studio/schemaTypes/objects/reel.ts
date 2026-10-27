import { defineField, defineType } from 'sanity'
import { PlayIcon } from '@sanity/icons/Play'
import { bunnyUrl } from '../shared/fields'

// A Bunny Stream video: the HLS playlist plus its thumbnail.
export const reel = defineType({
  name: 'reel',
  title: 'Reel',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({ name: 'src', title: 'Video URL', type: 'url', description: 'Bunny Stream playlist, ending in /playlist.m3u8', validation: bunnyUrl }),
    defineField({ name: 'thumbnailSrc', title: 'Thumbnail URL', type: 'url', description: 'Bunny Stream thumbnail (.jpg)', validation: bunnyUrl }),
  ],
  preview: { select: { title: 'src', media: 'thumbnailSrc' }, prepare: ({ title }) => ({ title: title ?? 'Reel' }) },
})
