import { type CollectionEntry, getCollection } from 'astro:content'
import type { BlogPostData } from '@/types/config'
import I18nKey from '@i18n/i18nKey'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, i18n } from '@i18n/translation'
import { getCategoryUrl, getPostUrlBySlug } from '@utils/url-utils'

/**
 * Shared utility to detect language of a content entry based on its ID/Slug and frontmatter.
 */
export function getEntryLang(entry: {
  id: string
  slug?: string
  data: { lang?: string }
}): string {
  // 1. Frontmatter priority
  if (entry.data.lang) return entry.data.lang

  // 2. Folder priority
  const path = entry.slug || entry.id
  const parts = path.split('/')
  if (parts.length > 1) {
    const matchedLocale = (SUPPORTED_LOCALES as readonly string[]).find(
      l => l.toLowerCase() === parts[0].toLowerCase(),
    )
    if (matchedLocale) return matchedLocale
  }

  // 3. Default
  return DEFAULT_LOCALE
}

/**
 * Shared utility to extract the logical slug (everything after the language prefix).
 */
export function getEntryLogicalSlug(entry: {
  id: string
  slug?: string
}): string {
  const path = entry.slug || entry.id
  const parts = path.split('/')
  if (parts.length > 1) {
    const matchedLocale = (SUPPORTED_LOCALES as readonly string[]).find(
      l => l.toLowerCase() === parts[0].toLowerCase(),
    )
    if (matchedLocale) return parts.slice(1).join('/')
  }
  return path
}

/**
 * Generic helper to resolve the best matching entry for a logical slug and target language.
 */
async function resolveLocalizedEntry<
  T extends {
    id: string
    slug?: string
    data: { lang?: string; order?: number }
  },
>(allItems: T[], logicalSlug: string, lang: string): Promise<T | undefined> {
  // 1. Exact match
  const exactMatch = allItems.find(
    item =>
      getEntryLang(item) === lang && getEntryLogicalSlug(item) === logicalSlug,
  )
  if (exactMatch) return exactMatch

  // 2. Fallback to default locale
  const defaultMatch = allItems.find(
    item =>
      getEntryLang(item) === DEFAULT_LOCALE &&
      getEntryLogicalSlug(item) === logicalSlug,
  )
  if (defaultMatch) return defaultMatch

  // 3. Fallback to any available language
  return allItems.find(item => getEntryLogicalSlug(item) === logicalSlug)
}

/* --- Posts Specific --- */

export function getPostLang(post: CollectionEntry<'posts'>): string {
  return getEntryLang(post)
}

export function getPostLogicalSlug(post: CollectionEntry<'posts'>): string {
  return getEntryLogicalSlug(post)
}

export async function getPostForLang(
  logicalSlug: string,
  lang: string,
): Promise<CollectionEntry<'posts'> | undefined> {
  const allPosts = await getRawSortedPosts()
  return resolveLocalizedEntry(allPosts, logicalSlug, lang)
}

export async function getSortedPostsForLang(lang: string) {
  const allPosts = await getRawSortedPosts()
  const logicalSlugs = Array.from(
    new Set(allPosts.map(p => getPostLogicalSlug(p))),
  )

  const resolvedPosts: CollectionEntry<'posts'>[] = []
  for (const slug of logicalSlugs) {
    const post = await getPostForLang(slug, lang)
    if (post) resolvedPosts.push(post)
  }

  return resolvedPosts.sort((a, b) => {
    const dateA = new Date(a.data.published)
    const dateB = new Date(b.data.published)
    return dateA > dateB ? -1 : 1
  })
}

export type PrevNextPost = {
  prevSlug?: string
  prevTitle?: string
  nextSlug?: string
  nextTitle?: string
}

export async function getPrevNextMapForLang(
  lang: string,
): Promise<Record<string, PrevNextPost>> {
  const posts = await getSortedPostsForLang(lang)
  const map: Record<string, PrevNextPost> = {}

  for (let i = 0; i < posts.length; i++) {
    const currentSlug = getPostLogicalSlug(posts[i])
    const next = i > 0 ? posts[i - 1] : undefined
    const prev = i < posts.length - 1 ? posts[i + 1] : undefined

    map[currentSlug] = {
      nextSlug: next ? getPostLogicalSlug(next) : undefined,
      nextTitle: next?.data.title,
      prevSlug: prev ? getPostLogicalSlug(prev) : undefined,
      prevTitle: prev?.data.title,
    }
  }

  return map
}

export async function getSortedPostsListForLang(
  lang: string,
): Promise<PostForList[]> {
  const sortedFullPosts = await getSortedPostsForLang(lang)
  return sortedFullPosts.map(post => ({
    slug: getPostLogicalSlug(post),
    data: post.data,
    lang: getPostLang(post),
  }))
}

export async function getRawSortedPosts() {
  const allBlogPosts = await getCollection('posts', ({ data }) => {
    if (import.meta.env.PROD && data.draft === true) return false
    return true
  })
  return allBlogPosts.sort((a, b) => {
    const dateA = new Date(a.data.published)
    const dateB = new Date(b.data.published)
    return dateA > dateB ? -1 : 1
  })
}

// Legacy function kept for compatibility
export async function getSortedPosts(): Promise<
  { body: string; data: BlogPostData; slug: string }[]
> {
  const allBlogPosts = (await getCollection('posts', ({ data }) => {
    return import.meta.env.PROD ? data.draft !== true : true
  })) as unknown as { body: string; data: BlogPostData; slug: string }[]

  const sorted = allBlogPosts.sort(
    (a: { data: BlogPostData }, b: { data: BlogPostData }) => {
      const dateA = new Date(a.data.published)
      const dateB = new Date(b.data.published)
      return dateA > dateB ? -1 : 1
    },
  )

  for (let i = 1; i < sorted.length; i++) {
    sorted[i].data.nextSlug = sorted[i - 1].slug
    sorted[i].data.nextTitle = sorted[i - 1].data.title
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    sorted[i].data.prevSlug = sorted[i + 1].slug
    sorted[i].data.prevTitle = sorted[i + 1].data.title
  }

  return sorted
}

export type PostForList = {
  slug: string
  data: CollectionEntry<'posts'>['data']
  lang: string
}

export async function getSortedPostsList(): Promise<PostForList[]> {
  const sortedFullPosts = await getRawSortedPosts()
  return sortedFullPosts.map(post => ({
    slug: getPostLogicalSlug(post),
    data: post.data,
    lang: getPostLang(post),
  }))
}

/* --- Tags & Categories --- */

export type Tag = {
  name: string
  count: number
}

export async function getTagList(lang?: string): Promise<Tag[]> {
  const posts = await getSortedPostsForLang(lang || DEFAULT_LOCALE)
  const countMap: { [key: string]: number } = {}
  for (const post of posts) {
    for (const tag of post.data.tags) {
      countMap[tag] = (countMap[tag] || 0) + 1
    }
  }
  const keys = Object.keys(countMap).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )
  return keys.map(key => ({ name: key, count: countMap[key] }))
}

export type Category = {
  name: string
  count: number
}

export async function getCategoryList(lang?: string): Promise<Category[]> {
  const posts = await getSortedPostsForLang(lang || DEFAULT_LOCALE)
  const count: { [key: string]: number } = {}
  posts.map((post: { data: { category: string | number } }) => {
    if (!post.data.category) {
      const ucKey = i18n(I18nKey.uncategorized, lang)
      count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1
      return
    }
    count[post.data.category] = count[post.data.category]
      ? count[post.data.category] + 1
      : 1
  })

  const lst = Object.keys(count).sort((a, b) => {
    return a.toLowerCase().localeCompare(b.toLowerCase())
  })

  const ret: Category[] = []
  for (const c of lst) {
    ret.push({ name: c, count: count[c] })
  }
  return ret
}

/* --- Alternates --- */

export async function getPostAlternates(
  logicalSlug: string,
): Promise<{ lang: string; href: string }[]> {
  const allPosts = await getRawSortedPosts()
  const aliases = allPosts.filter(
    post => getPostLogicalSlug(post) === logicalSlug,
  )
  const site = import.meta.env.SITE.replace(/\/$/, '')

  const alternates = aliases.map(post => {
    const lang = getPostLang(post)
    return {
      lang: lang,
      href: `${site}${getPostUrlBySlug(logicalSlug, lang)}`,
    }
  })

  alternates.push({
    lang: 'x-default',
    href: `${site}${getPostUrlBySlug(logicalSlug, DEFAULT_LOCALE)}`,
  })

  return alternates
}
