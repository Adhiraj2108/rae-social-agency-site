import { createClient } from '@sanity/client';
import { toHTML } from '@portabletext/to-html';
import type { PortableTextBlock } from '@portabletext/types';

// Project ID and dataset are public; reads need no token (the dataset is public).
export const sanity = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || 'khgb3vuz',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-10-01',
  useCdn: false, // static builds should always read the latest published content
  perspective: 'published',
});

/** Rich text from the Studio rendered to the same <p>/<strong> HTML Webflow produced. */
export function richTextToHtml(blocks: PortableTextBlock[] | null | undefined): string | null {
  return blocks?.length ? toHTML(blocks) : null;
}
