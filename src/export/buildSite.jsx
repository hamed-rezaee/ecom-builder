import { renderToStaticMarkup } from 'react-dom/server'
import blocksCss from '../blocks/blocks.css?raw'
import runtime from './runtime.js?raw'
import SiteRoot from './SiteRoot'
import { productImage } from '../utils/helpers'

const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )

export function buildSite(site, { inline = false } = {}) {
  const body = renderToStaticMarkup(<SiteRoot site={site} />)
  const runtimeData = JSON.stringify({
    name: site.name,
    currency: site.theme.currency,
    products: site.products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      image: productImage(p),
    })),
  }).replace(/</g, '\\u003c')

  const css = `${blocksCss}\nbody { margin: 0; }\n`
  const js = runtime

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
${head}
</head>
<body>
${body}
<script>window.__SITE__ = ${runtimeData}</script>
${script}
</body>
</html>
`
  return { html, css, js }
}
