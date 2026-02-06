<script lang="ts">
import I18nKey from '@i18n/i18nKey'
import { i18n } from '@i18n/translation'
import Icon from '@iconify/svelte'
import { url } from '@utils/url-utils.ts'
import { onMount } from 'svelte'

let keyword = ''
let result = []
const fakeResult = [
  {
    url: url('/'),
    meta: {
      title: 'This Is a Fake Search Result',
    },
    excerpt:
      'Because the search cannot work in the <mark>dev</mark> environment.',
  },
  {
    url: url('/'),
    meta: {
      title: 'If You Want to Test the Search',
    },
    excerpt: 'Try running <mark>npm build && npm preview</mark> instead.',
  },
]

let search = (keyword: string) => {}

onMount(() => {
  search = async (keyword: string) => {
    if (!keyword) {
      result = []
      return
    }

    let arr = []
    if (import.meta.env.PROD) {
      const ret = await pagefind.search(keyword)
      for (const item of ret.results) {
        arr.push(await item.data())
      }
    } else {
      arr = fakeResult
    }

    result = arr
  }

  // Check for query parameter
  const params = new URLSearchParams(window.location.search)
  const q = params.get('q')
  if (q) {
    keyword = q
    search(keyword)
  }
})

$: search(keyword)
</script>

<div class="search-page">
  <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3 mb-6
      before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
      before:absolute before:-left-3 before:top-[0.33rem]"
  >
    {i18n(I18nKey.search)}
  </div>

  <div class="relative flex items-center mb-6">
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-4 text-black/30 dark:text-white/30" />
    <input
      placeholder={i18n(I18nKey.search)}
      bind:value={keyword}
      class="w-full pl-12 pr-4 py-3 rounded-xl text-sm bg-black/[0.04] hover:bg-black/[0.06] focus:bg-black/[0.06]
        dark:bg-white/5 dark:hover:bg-white/10 dark:focus:bg-white/10
        text-black/70 dark:text-white/70 outline-none transition"
    />
  </div>

  {#if result.length > 0}
    <div class="text-sm text-black/40 dark:text-white/40 mb-4">
      {result.length} {result.length === 1 ? i18n(I18nKey.postCount) : i18n(I18nKey.postsCount)}
    </div>
  {/if}

  <div class="flex flex-col gap-2">
    {#each result as item}
      <a href={item.url}
         class="transition group block rounded-xl text-lg px-4 py-3
           hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
        <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
          {item.meta.title}
          <Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]" />
        </div>
        <div class="transition text-sm text-50 mt-1">
          {@html item.excerpt}
        </div>
      </a>
    {/each}
  </div>

  {#if keyword && result.length === 0}
    <div class="text-center text-black/30 dark:text-white/30 py-8">
      {i18n(I18nKey.search)} - no results found
    </div>
  {/if}
</div>

<style>
  input:focus {
    outline: 0;
  }
</style>
