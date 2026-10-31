// Content collections, one per CMS type. Content is edited in Sanity Studio
// (studio/) and fetched here at build time; the zod schemas below re-check it.
// `order` is the drag-and-drop order from the Studio.
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import type { PortableTextBlock } from '@portabletext/types';
import { richTextToHtml, sanity } from './lib/sanity';

/** Loads every published document of a type, in Studio order. */
function fromSanity<T extends { _id: string }>(type: string, projection: string, toEntry: (doc: T) => { id?: string } & Record<string, unknown>) {
  return async () => {
    const docs = await sanity.fetch<T[]>(`*[_type == $type] | order(orderRank asc) ${projection}`, { type });
    return docs.map((doc, i) => ({ id: doc._id, ...toEntry(doc), order: i + 1 }));
  };
}

type Img = { src: string; alt: string | null } | null;
type Rich = PortableTextBlock[] | null;

const image = z.object({ src: z.string(), alt: z.string().default('') });
const richText = z.string().nullable().default(null); // HTML rendered from Studio rich text
const link = z.url().nullable().default(null);

const clientLogos = defineCollection({
  loader: fromSanity<{ _id: string; name: string; logoImage: Img }>(
    'clientLogo',
    '{ _id, name, "logoImage": logoImage{ "src": asset->url, alt } }',
    (d) => ({ name: d.name, logoImage: d.logoImage?.src ? { src: d.logoImage.src, alt: d.logoImage.alt ?? '' } : null }),
  ),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    logoImage: image.nullable().default(null),
  }),
});

const testimonials = defineCollection({
  loader: fromSanity<{ _id: string; name: string; logo: Img; testimonial: string | null; clientName: string | null; designation: string | null }>(
    'testimonial',
    '{ _id, name, "logo": logo{ "src": asset->url }, testimonial, clientName, designation }',
    (d) => ({ ...d, logo: d.logo?.src ? { src: d.logo.src, alt: '' } : null }),
  ),
  schema: z.object({
    name: z.string(), // brand name
    order: z.number(),
    logo: image.nullable().default(null),
    testimonial: z.string().nullable().default(null),
    clientName: z.string().nullable().default(null),
    designation: z.string().nullable().default(null),
  }),
});

const campaigns = defineCollection({
  loader: fromSanity<{ _id: string } & Record<string, unknown>>(
    'campaign',
    '{ _id, name, side, thumbnailSrc, videoSrc, instagramHandle, instagramLink, servicesProvided }',
    (d) => d,
  ),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    /** Which column of the campaigns section the reel sits in. */
    side: z.enum(['Left', 'Right']).nullable().default(null),
    thumbnailSrc: link,
    videoSrc: link,
    instagramHandle: z.string().nullable().default(null),
    instagramLink: link,
    servicesProvided: z.string().nullable().default(null),
  }),
});

const services = defineCollection({
  loader: fromSanity<{ _id: string; name: string; description: Rich }>(
    'service',
    '{ _id, name, description }',
    (d) => ({ name: d.name, description: richTextToHtml(d.description) }),
  ),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    description: richText,
  }),
});

const projects = defineCollection({
  loader: fromSanity<{ _id: string; slug: string; credits: Rich; results: Rich; moreVideos: unknown[] | null } & Record<string, unknown>>(
    'project',
    '{ _id, "slug": slug.current, name, clientName, servicesProvided, credits, brief, approach, results, videoSrc, thumbnailUrl, "moreVideos": moreVideos[]{ src, thumbnailSrc } }',
    // the slug is the id: it is the drawer's deep link (/#slug)
    ({ _id: _, slug, credits, results, moreVideos, ...rest }) => ({
      ...rest,
      id: slug,
      credits: richTextToHtml(credits),
      results: richTextToHtml(results),
      moreVideos: moreVideos ?? [],
    }),
  ),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    clientName: z.string().nullable().default(null),
    servicesProvided: z.string().nullable().default(null),
    credits: richText,
    brief: z.string().nullable().default(null),
    approach: z.string().nullable().default(null),
    results: richText,
    videoSrc: link,
    /** Full Bunny thumbnail URL for the main video. */
    thumbnailUrl: link,
    /** Up to five extra reels for the drawer's "More from" carousel (Webflow fields Video 1-5). */
    moreVideos: z
      .array(z.object({ src: link, thumbnailSrc: link }))
      .max(5)
      .default([]),
  }),
});

export const collections = { clientLogos, testimonials, campaigns, services, projects };
