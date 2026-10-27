import { getCollection, type CollectionEntry, type CollectionKey } from 'astro:content';

type Item<C extends CollectionKey> = CollectionEntry<C>['data'] & { id: string };

/** All entries of a collection, in the order they appear on the site. */
async function ordered<C extends CollectionKey>(name: C): Promise<Item<C>[]> {
  const entries = (await getCollection(name)) as CollectionEntry<C>[];
  return entries
    .map((entry) => ({ id: entry.id, ...entry.data }) as Item<C>)
    .sort((a, b) => (a as { order: number }).order - (b as { order: number }).order);
}

export const getClientLogos = () => ordered('clientLogos');
export const getTestimonials = () => ordered('testimonials');
export const getCampaigns = () => ordered('campaigns');
export const getServices = () => ordered('services');
export const getProjects = () => ordered('projects');

/**
 * Webflow adds `w-dyn-bind-empty` to an element whose bound CMS field is empty.
 * The site's CSS hides those, and `:has(.w-dyn-bind-empty)` rules hide the
 * surrounding row, so keep the same behaviour.
 */
export function bindClass(base: string, value: unknown): string | undefined {
  const empty = value === null || value === undefined || value === '';
  return [base, empty ? 'w-dyn-bind-empty' : ''].filter(Boolean).join(' ') || undefined;
}

/** The drawer's "More from" carousel always renders five slots, like the Webflow template. */
export function moreVideoSlots(project: { moreVideos: { src: string | null; thumbnailSrc: string | null }[] }) {
  return Array.from({ length: 5 }, (_, i) => ({
    src: project.moreVideos[i]?.src ?? '',
    thumbnailSrc: project.moreVideos[i]?.thumbnailSrc ?? '',
    flag: '',
  }));
}
