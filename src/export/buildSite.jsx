import { renderToStaticMarkup } from 'react-dom/server'
import aosCss from 'aos/dist/aos.css?raw'
import aosJs from 'aos/dist/aos.js?raw'
import blocksCss from '../blocks/blocks.css?raw'
import { googleFontsUrl } from '../data/fonts'
import runtime from './runtime.js?raw'
import wireJs from './wireEntry.js?iife'
import SiteRoot from './SiteRoot'
import { productImage } from '../utils/helpers'
import { normalizeTheme, themeCss, usedGoogleFonts } from '../utils/theme'

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

const fontPath = (f) => `fonts/${f.id}.${f.ext}`

export function buildSite(rawSite, { inline = false } = {}) {
  const site = { ...rawSite, theme: normalizeTheme(rawSite.theme) }
  const { theme } = site
  const body = renderToStaticMarkup(<SiteRoot site={site} />)
  const runtimeData = JSON.stringify({
    name: site.name,
    currency: theme.currency,
    darkMode: theme.darkMode,
    pageTransition: theme.pageTransition,
    anim: { duration: theme.animDuration, easing: theme.animEasing, once: theme.animOnce },
    products: site.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      image: productImage(p),
    })),
  }).replace(/</g, '\\u003c')

  const css = `${aosCss}\n${blocksCss}\n${themeCss(theme, inline ? {} : { fontSrc: fontPath })}\nbody { margin: 0; }\n`
  const usesWire = site.pages.some((pg) => pg.blocks.some((b) => b.type === 'hero' && b.props.wire === true))
  const js = `${aosJs}\n;\n${usesWire ? `${wireJs}\n;\n` : ''}${runtime}`

  // Uploaded fonts are files in the ZIP; the inline preview embeds them in the CSS instead.
  const files = inline
    ? []
    : theme.customFonts.map((f) => ({ path: fontPath(f), base64: f.data.slice(f.data.indexOf(',') + 1) }))

  const google = usedGoogleFonts(theme)
  const fontLinks = google.length
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${escapeHtml(googleFontsUrl(google))}">
`
    : ''

  const head = inline ? `<style>${css}</style>` : '<link rel="stylesheet" href="site.css">'
  const script = inline
    ? `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`
    : '<script src="site.js"></script>'

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(site.name)}</title>
${fontLinks}${head}
<noscript><style>[data-aos]{opacity:1!important;transform:none!important}</style></noscript>
</head>
<body>
${body}
<script>window.__SITE__ = ${runtimeData}</script>
${script}
</body>
</html>
`
  return { html, css, js, files }
}
