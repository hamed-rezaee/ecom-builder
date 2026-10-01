import { describe, expect, it } from 'vitest'
import { createStarterSite } from '../data/starterSite'
import { buildSite } from '../export/buildSite'
import { normalizeSite } from '../export/siteJson'
import { fmt, normalizeLocales, normalizeTranslations } from './i18n'
import { collectStrings, localizeSite } from './translate'

function withFrench() {
  const site = createStarterSite()
  site.locales = { default: 'en', enabled: ['fr'] }
  const hero = site.pages[0].blocks.find((b) => b.type === 'hero')
  site.translations = {
    fr: {
      'site:name': 'Lumen FR',
      [`b:${hero.id}:heading`]: 'Des produits durables',
      'product:mug:name': 'Tasse',
      'ui:addToCart': 'Ajouter au panier',
      'header:links.1.label': 'Boutique',
    },
  }
  return { site, hero }
}

describe('locales', () => {
  it('normalizes locale lists', () => {
    expect(normalizeLocales({ default: 'xx', enabled: ['fr', 'fr', 'en', 'zz'] })).toEqual({
      default: 'en',
      enabled: ['fr'],
    })
    expect(normalizeTranslations({ fr: { a: 'x', b: ' ', c: 3 }, de: { a: 'y' } }, { default: 'en', enabled: ['fr'] })).toEqual({
      fr: { a: 'x' },
    })
  })

  it('fills template variables', () => {
    expect(fmt('Hi {name}, {x}', { name: 'Ann' })).toBe('Hi Ann, {x}')
  })

  it('round-trips through normalizeSite', () => {
    const { site } = withFrench()
    const back = normalizeSite(JSON.parse(JSON.stringify(site)))
    expect(back.locales.enabled).toEqual(['fr'])
    expect(back.translations.fr['site:name']).toBe('Lumen FR')
    expect(normalizeSite({ pages: site.pages }).locales).toEqual({ default: 'en', enabled: [] })
  })
})

describe('translate', () => {
  it('collects strings and applies a locale without touching the source', () => {
    const { site, hero } = withFrench()
    expect(collectStrings(site).flatMap((g) => g.items.map((i) => i.key))).toContain(`b:${hero.id}:heading`)
    const fr = localizeSite(site, 'fr')
    expect(fr.name).toBe('Lumen FR')
    expect(fr.products.find((p) => p.id === 'mug').name).toBe('Tasse')
    expect(fr.header.links[1].label).toBe('Boutique')
    expect(fr.ui.addToCart).toBe('Ajouter au panier')
    expect(fr.pages[0].blocks.find((b) => b.id === hero.id).props.heading).toBe('Des produits durables')
    expect(site.name).toBe('Lumen & Co.')
    expect(localizeSite(site, 'en').name).toBe('Lumen & Co.')
  })

  it('builds one page per language with a switcher', () => {
    const { site } = withFrench()
    const en = buildSite(site)
    const fr = buildSite(site, { locale: 'fr' })
    expect(en.html).toContain('<html lang="en" dir="ltr">')
    expect(en.html).toContain('data-lang-switcher')
    expect(fr.html).toContain('<html lang="fr" dir="ltr">')
    expect(fr.html).toContain('href="../site.css"')
    expect(fr.html).toContain('Ajouter au panier')
    expect(fr.html).toContain('Lumen FR')
  })

  it('hides the language selector when the header option is off', () => {
    const { site } = withFrench()
    site.header.showLanguage = false
    expect(buildSite(site).html).not.toContain('data-lang-switcher')
  })
})
