<script lang="ts">
import I18nKey from '@i18n/i18nKey'
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getTranslation,
  i18n,
} from '@i18n/translation'
import Icon from '@iconify/svelte'

export const currentLang: string = DEFAULT_LOCALE

function getLangName(locale: string): string {
  return getTranslation(locale)[I18nKey.langName] || locale
}

function switchLang(locale: string) {
  const currentPath = window.location.pathname
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')

  // Strip base prefix
  let path = currentPath
  if (base && path.startsWith(base)) {
    path = path.slice(base.length)
  }

  // Strip current language prefix from the path
  const segments = path.replace(/^\//, '').split('/')
  const firstSegment = segments[0]?.toLowerCase()
  const matchedLocale = SUPPORTED_LOCALES.find(
    l => l.toLowerCase() === firstSegment,
  )
  if (matchedLocale && matchedLocale !== DEFAULT_LOCALE) {
    segments.shift()
  }

  // Build new path with the selected locale
  let newPath: string
  if (locale === DEFAULT_LOCALE) {
    newPath = `/${segments.join('/')}`
  } else {
    newPath = `/${locale}/${segments.join('/')}`
  }

  // Add base back
  if (base) {
    newPath = `${base}${newPath}`
  }

  // Normalize slashes
  newPath = newPath.replace(/\/+/g, '/')
  if (!newPath.endsWith('/')) {
    newPath += '/'
  }

  window.location.href = newPath
}

function showPanel() {
  const panel = document.querySelector('#lang-panel')
  panel?.classList.remove('float-panel-closed')
}

function hidePanel() {
  const panel = document.querySelector('#lang-panel')
  panel?.classList.add('float-panel-closed')
}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="relative z-50" on:mouseleave={hidePanel}>
  <button
    aria-label={i18n(I18nKey.language)}
    class="btn-plain scale-animation rounded-lg h-11 w-11 active:scale-90"
    on:click={() => showPanel()}
    on:mouseenter={showPanel}
  >
    <Icon icon="material-symbols:translate-rounded" class="text-[1.25rem]" />
  </button>

  <div
    id="lang-panel"
    class="hidden lg:block absolute transition float-panel-closed top-11 -right-2 pt-5"
  >
    <div class="card-base float-panel p-2 max-h-80 overflow-y-auto">
      {#each SUPPORTED_LOCALES as locale}
        <button
          class="flex transition whitespace-nowrap items-center !justify-start w-full btn-plain scale-animation rounded-lg h-9 px-3 font-medium active:scale-95 mb-0.5"
          class:current-theme-btn={currentLang === locale}
          on:click={() => switchLang(locale)}
        >
          <span class="mr-2">{getLangName(locale)}</span>
        </button>
      {/each}
    </div>
  </div>
</div>
