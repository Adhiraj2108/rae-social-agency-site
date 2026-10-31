// One-time import of the Webflow CMS export (webflow-export/*.json) into Sanity.
// Writes webflow-import.ndjson; `npm run import-webflow` builds it and runs
// `sanity dataset import`, which uploads the referenced local images.
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LexoRank } from 'lexorank'

const here = dirname(fileURLToPath(import.meta.url))
const load = (name) => JSON.parse(readFileSync(resolve(here, 'webflow-export', `${name}.json`), 'utf8'))
const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : (ENTITIES[e] ?? m),
  )

// Webflow rich text here is only <p> with <strong>/<em>; fail loudly on anything else.
function htmlToBlocks(html) {
  if (!html) return undefined
  const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1])
  if (paragraphs.join('').length === 0 || html.replace(/<p>[\s\S]*?<\/p>/g, '').trim()) throw new Error(`Unexpected rich text: ${html}`)
  return paragraphs.map((inner) => {
    const children = []
    const marks = []
    for (const tok of inner.split(/(<\/?(?:strong|em|b|i)>)/)) {
      const tag = tok.match(/^<(\/?)(strong|em|b|i)>$/)
      if (tag) {
        const mark = { b: 'strong', i: 'em' }[tag[2]] ?? tag[2]
        if (tag[1]) marks.splice(marks.lastIndexOf(mark), 1)
        else marks.push(mark)
        continue
      }
      if (/<[^>]+>/.test(tok)) throw new Error(`Unexpected tag in: ${inner}`)
      if (tok) children.push({ _type: 'span', _key: key(), text: decode(tok), marks: [...marks] })
    }
    return { _type: 'block', _key: key(), style: 'normal', markDefs: [], children }
  })
}

const image = (src, extra = {}) =>
  src ? { _type: 'image', _sanityAsset: `image@file://${resolve(here, 'webflow-export', src.replace('/images/cms/', 'images/'))}`, ...extra } : undefined

function ranked(items) {
  let rank = LexoRank.min()
  return [...items].sort((a, b) => a.order - b.order).map((item) => {
    rank = rank.genNext().genNext()
    return { item, orderRank: rank.toString() }
  })
}

const clean = (doc) => Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined && v !== null))
const docs = []

for (const { item, orderRank } of ranked(load('projects'))) {
  docs.push(clean({
    _id: randomUUID(), _type: 'project', orderRank,
    name: item.name,
    slug: { _type: 'slug', current: item.id },
    clientName: item.clientName,
    servicesProvided: item.servicesProvided,
    brief: item.brief,
    approach: item.approach,
    results: htmlToBlocks(item.results),
    credits: htmlToBlocks(item.credits),
    videoSrc: item.videoSrc,
    thumbnailUrl: item.thumbnailUrl,
    moreVideos: item.moreVideos.length ? item.moreVideos.map((v) => ({ _type: 'reel', _key: key(), ...clean(v) })) : undefined,
  }))
}
for (const { item, orderRank } of ranked(load('services'))) {
  docs.push(clean({ _id: randomUUID(), _type: 'service', orderRank, name: item.name, description: htmlToBlocks(item.description) }))
}
for (const { item, orderRank } of ranked(load('testimonials'))) {
  docs.push(clean({
    _id: randomUUID(), _type: 'testimonial', orderRank,
    name: item.name, logo: image(item.logo?.src), testimonial: item.testimonial, clientName: item.clientName, designation: item.designation,
  }))
}
for (const { item, orderRank } of ranked(load('campaigns'))) {
  docs.push(clean({
    _id: randomUUID(), _type: 'campaign', orderRank,
    name: item.name, side: item.side, videoSrc: item.videoSrc, thumbnailSrc: item.thumbnailSrc,
    instagramHandle: item.instagramHandle, instagramLink: item.instagramLink, servicesProvided: item.servicesProvided,
  }))
}
for (const { item, orderRank } of ranked(load('client-logos'))) {
  docs.push(clean({
    _id: randomUUID(), _type: 'clientLogo', orderRank,
    name: item.name, logoImage: image(item.logoImage?.src, item.logoImage?.alt ? { alt: item.logoImage.alt } : {}),
  }))
}

writeFileSync(resolve(here, 'webflow-import.ndjson'), docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
console.log(`Wrote ${docs.length} documents to migrations/webflow-import.ndjson`)
