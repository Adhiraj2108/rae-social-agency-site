import type { StructureResolver } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { CaseIcon } from '@sanity/icons/Case'
import { ThListIcon } from '@sanity/icons/ThList'
import { DoubleQuoteIcon } from '@sanity/icons/DoubleQuote'
import { PlayIcon } from '@sanity/icons/Play'
import { ImagesIcon } from '@sanity/icons/Images'

// Every list is drag-to-reorder: the order here is the order on the website.
export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Website content')
    .items([
      orderableDocumentListDeskItem({ type: 'project', title: 'Projects', icon: CaseIcon, S, context }),
      orderableDocumentListDeskItem({ type: 'service', title: 'Services', icon: ThListIcon, S, context }),
      orderableDocumentListDeskItem({ type: 'testimonial', title: 'Testimonials', icon: DoubleQuoteIcon, S, context }),
      orderableDocumentListDeskItem({ type: 'campaign', title: 'Campaigns', icon: PlayIcon, S, context }),
      orderableDocumentListDeskItem({ type: 'clientLogo', title: 'Client logos', icon: ImagesIcon, S, context }),
    ])
