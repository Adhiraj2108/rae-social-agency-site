import type { UrlRule } from 'sanity'

export const bunnyUrl = (rule: UrlRule) => rule.uri({ scheme: ['https'] })
