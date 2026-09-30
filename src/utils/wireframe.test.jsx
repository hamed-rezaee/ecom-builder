import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Hero } from '../blocks/content'
import { registry } from '../blocks/registry'
import { createStarterSite } from '../data/starterSite'
import { buildSite } from '../export/buildSite'
import { mountWireframe, parseWireOptions } from './wireframe'

const heroOf = (site) => site.pages.flatMap((p) => p.blocks).find((b) => b.type === 'hero')

describe('parseWireOptions', () => {
  it('falls back to safe defaults for bad input', () => {
    expect(parseWireOptions({ shape: 'x', style: 'y', color: 'red;}', speed: 'fast', pulse: false, interactive: 'no' })).toEqual({
      shape: 'terrain',
      style: 'lines',
      color: '#ffffff',
      speed: 50,
      pulse: false,
      interactive: true,
    })
  })

  it('clamps speed and keeps valid values', () => {
    expect(parseWireOptions({ shape: 'galaxy', style: 'dots', color: '#00ff88', speed: 500, interactive: false })).toEqual({
      shape: 'galaxy',
      style: 'dots',
      color: '#00ff88',
      speed: 100,
      pulse: true,
      interactive: false,
    })
  })
})

describe('Hero grid animation', () => {
  it('renders a grid layer only when chosen and sanitizes the color', () => {
    const defaults = registry.hero.defaults
    expect(renderToStaticMarkup(<Hero props={defaults} />)).not.toContain('eb-hero-grid')
    const html = renderToStaticMarkup(<Hero props={{ ...defaults, gridStyle: 'floor', gridColor: 'red;}' }} />)
    expect(html).toContain('eb-hero-grid-floor')
    expect(html).toContain('--eb-grid-c:#ffffff')
    expect(renderToStaticMarkup(<Hero props={{ ...defaults, gridStyle: 'bogus' }} />)).not.toContain('eb-hero-grid')
  })
})

describe('Hero wireframe', () => {
  it('renders the mount point only when enabled', () => {
    const defaults = registry.hero.defaults
    expect(renderToStaticMarkup(<Hero props={defaults} />)).not.toContain('eb-hero-wire')
    const html = renderToStaticMarkup(<Hero props={{ ...defaults, wire: true, wireShape: 'sphere' }} />)
    expect(html).toContain('class="eb-hero-wire"')
    expect(html).toContain('&quot;shape&quot;:&quot;sphere&quot;')
  })

  it('is a no-op without WebGL', () => {
    const el = document.createElement('div')
    const dispose = mountWireframe(el, {})
    expect(typeof dispose).toBe('function')
    expect(el.children).toHaveLength(0)
    dispose()
  })
})

describe('buildSite wireframe bundle', () => {
  it('ships the bundle only when a hero enables it', () => {
    const site = createStarterSite()
    heroOf(site).props.wire = false
    expect(buildSite(site, { inline: true }).js).not.toContain('data-wire-ready')
    heroOf(site).props.wire = true
    const { html, js } = buildSite(site, { inline: true })
    expect(js).toContain('data-wire-ready')
    expect(html).toContain('eb-hero-wire')
  })
})
