// Content collections, one per Webflow CMS collection.
// Each collection is a JSON array in src/content/; `id` is the Webflow item slug.
// `order` reproduces the order the items appear in on the live Webflow site.
import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const image = z.object({ src: z.string(), alt: z.string().default('') });
const richText = z.string().nullable().default(null); // HTML from Webflow's rich text editor
const link = z.url().nullable().default(null);

const clientLogos = defineCollection({
  loader: file('src/content/client-logos.json'),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    logoImage: image.nullable().default(null),
  }),
});

const testimonials = defineCollection({
  loader: file('src/content/testimonials.json'),
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
  loader: file('src/content/campaigns.json'),
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
  loader: file('src/content/services.json'),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    description: richText,
  }),
});

const projects = defineCollection({
  loader: file('src/content/projects.json'),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    clientName: z.string().nullable().default(null),
    servicesProvided: z.string().nullable().default(null),
    description: richText,
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
