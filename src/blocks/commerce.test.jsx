import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createStarterSite } from '../data/starterSite'
import { buildSite } from '../export/buildSite'
import { mapEmbedUrl, videoEmbedUrl } from '../utils/helpers'
import { normalizeTheme } from '../utils/theme'
import { registry } from './registry'
import { ProductGrid } from './commerce'

const siteWith = (n) => ({
  theme: normalizeTheme({}),
  products: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, price: 1, image: '' })),
})
const render = (props, n = 5) => renderToStaticMarkup(<ProductGrid props={props} site={siteWith(n)} />)

describe('ProductGrid pagination', () => {
  it('splits products into pages and hides later cards', () => {
    const html = render({ perPage: 2, paginationStyle: 'pages', columns: 3 })
    expect(html).toContain('data-paged')
    expect(html.match(/data-pager-go="\d"/g)).toHaveLength(3)
    expect(html.match(/<article class="eb-card" hidden/g)).toHaveLength(3)
  })

  it('renders a load more button', () => {
    expect(render({ perPage: 2, paginationStyle: 'loadmore' })).toContain('data-pager-go="more"')
  })

  it('has no pager when perPage is 0, style is none, or one page fits', () => {
    expect(render({ perPage: 0 })).not.toContain('data-pager-go')
    const none = render({ perPage: 2, paginationStyle: 'none' })
    expect(none).not.toContain('data-pager-go')
    expect(none.match(/<article/g)).toHaveLength(2)
    expect(render({ perPage: 10, paginationStyle: 'pages' })).not.toContain('data-pager-go')
  })

  it('renders hidden in-cart badges unless turned off', () => {
    expect(render({ perPage: 0 })).toContain('data-in-cart="p0" hidden')
    expect(render({ perPage: 0, showInCart: false })).not.toContain('data-in-cart')
  })
})

describe('export runtime', () => {
  it('ships pager and in-cart handling', () => {
    const { js } = buildSite(createStarterSite(), { inline: true })
    expect(js).toContain('data-pager-go')
    expect(js).toContain('data-in-cart')
  })
})

describe('embed helpers', () => {
  it('only allows YouTube and Vimeo', () => {
    expect(videoEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(videoEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toContain('/embed/dQw4w9WgXcQ')
    expect(videoEmbedUrl('https://vimeo.com/123456')).toBe('https://player.vimeo.com/video/123456')
    expect(videoEmbedUrl('https://evil.example/embed/dQw4w9WgXcQ')).toBe('')
    expect(videoEmbedUrl('javascript:alert(1)')).toBe('')
    expect(videoEmbedUrl('https://www.youtube.com/watch?v="><script>')).toBe('')
  })

  it('encodes map queries', () => {
    expect(mapEmbedUrl('A & B')).toBe('https://www.google.com/maps?q=A%20%26%20B&output=embed')
    expect(mapEmbedUrl('  ')).toBe('')
  })
})

describe('new blocks', () => {
  it('render with defaults', () => {
    const site = siteWith(1)
    for (const type of ['gallery', 'video', 'logoCloud', 'team', 'map', 'cta', 'stats', 'pricing', 'contact', 'divider']) {
      const { Component, defaults } = registry[type]
      expect(() => renderToStaticMarkup(<Component props={defaults} site={site} />)).not.toThrow()
    }
  })
})
