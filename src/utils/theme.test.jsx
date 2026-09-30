import { describe, expect, it } from 'vitest'
import { createStarterSite } from '../data/starterSite'
import { buildSite } from '../export/buildSite'
import { animAttrs, normalizeAnim } from './animation'
import { DEFAULT_THEME, normalizeTheme, themeCss, usedGoogleFonts } from './theme'

const font = { id: 'f_abc', name: 'Brand', ext: 'woff2', data: 'data:font/woff2;base64,AAAA' }

describe('normalizeTheme', () => {
  it('fills defaults for an old theme', () => {
    const t = normalizeTheme({ primary: '#ff0000', font: 'serif', radius: 4, currency: '€' })
    expect(t.primary).toBe('#ff0000')
    expect(t.darkMode).toBe('off')
    expect(t.containerWidth).toBe(DEFAULT_THEME.containerWidth)
  })

  it('rejects CSS injection and clamps ranges', () => {
    const t = normalizeTheme({
      primary: 'red;}body{display:none',
      baseSize: 999,
      shadow: 'x',
      font: 'g:Not A Font',
      headingFont: 'u:missing',
    })
    expect(t.primary).toBe(DEFAULT_THEME.primary)
    expect(t.baseSize).toBe(22)
    expect(t.shadow).toBe('none')
    expect(t.font).toBe('sans')
    expect(t.headingFont).toBe('')
  })

  it('drops malformed uploaded fonts', () => {
    const t = normalizeTheme({
      customFonts: [font, { ...font, id: 'bad', data: 'javascript:alert(1)' }, { ...font, id: 'x y' }],
    })
    expect(t.customFonts.map((f) => f.id)).toEqual(['f_abc'])
  })
})

describe('themeCss', () => {
  it('emits variables, fonts and dark rules', () => {
    const css = themeCss({ font: 'g:Inter', headingFont: 'u:f_abc', customFonts: [font], darkMode: 'system' })
    expect(css).toContain('--eb-font:"Inter"')
    expect(css).toContain('@font-face{font-family:"eb-font-f_abc"')
    expect(css).toContain('[data-theme="dark"]')
    expect(css).toContain('prefers-color-scheme:dark')
  })

  it('omits dark rules when off and supports a font URL override', () => {
    const css = themeCss({ customFonts: [font] }, { fontSrc: (f) => `fonts/${f.id}.woff2` })
    expect(css).not.toContain('data-theme')
    expect(css).toContain('url("fonts/f_abc.woff2")')
  })

  it('lists only used Google families', () => {
    expect(usedGoogleFonts({ font: 'g:Lora', headingFont: 'g:Inter' }).map((f) => f.name).sort()).toEqual([
      'Inter',
      'Lora',
    ])
    expect(usedGoogleFonts({ font: 'serif' })).toEqual([])
  })
})

describe('animation', () => {
  it('needs no wrapper when everything is none', () => {
    expect(animAttrs(undefined, { animEntrance: 'none', animHover: 'none' })).toBeNull()
  })

  it('inherits theme defaults and applies block overrides', () => {
    const theme = { animEntrance: 'fade', animHover: 'none' }
    expect(animAttrs(undefined, theme)['data-aos']).toBe('fade')
    const a = animAttrs({ entrance: 'zoom-in', hover: 'lift', delay: 200 }, theme)
    expect(a['data-aos']).toBe('zoom-in')
    expect(a['data-aos-delay']).toBe('200')
    expect(a.className).toContain('eb-hover-lift')
  })

  it('normalizes bad values', () => {
    expect(normalizeAnim({ entrance: 'nope', delay: 99999 })).toMatchObject({ entrance: 'inherit', delay: 2000 })
  })
})

describe('buildSite', () => {
  it('includes AOS, animation attributes and the Google fonts link', () => {
    const site = createStarterSite()
    site.theme.animEntrance = 'fade-up'
    site.theme.font = 'g:Inter'
    const { html, js, css } = buildSite(site, { inline: true })
    expect(html).toContain('data-aos="fade-up"')
    expect(html).toContain('fonts.googleapis.com/css2?family=Inter')
    expect(html).toContain('[data-aos]{opacity:1!important')
    expect(js).toContain('AOS')
    expect(css).toContain('--eb-primary')
  })

  it('writes uploaded fonts as files in the ZIP build', () => {
    const site = createStarterSite()
    site.theme.customFonts = [font]
    site.theme.font = 'u:f_abc'
    const { css, files } = buildSite(site)
    expect(css).toContain('url("fonts/f_abc.woff2")')
    expect(files).toEqual([{ path: 'fonts/f_abc.woff2', base64: 'AAAA' }])
  })
})
