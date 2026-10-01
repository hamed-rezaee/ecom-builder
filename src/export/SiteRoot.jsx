import { registry } from '../blocks/registry'
import { CartView, CheckoutView, ProductDetail } from '../blocks/commerce'
import { pageRoute } from '../utils/helpers'
import { animAttrs } from '../utils/animation'
import { ui } from '../utils/i18n'

function Route({ route, title, hidden = true, children }) {
  return (
    <section className="eb-route" data-route={route} data-title={title} hidden={hidden}>
      {children}
    </section>
  )
}

export default function SiteRoot({ site }) {
  const HeaderBlock = registry.header.Component
  const FooterBlock = registry.footer.Component
  return (
    <div className="eb-site">
      <HeaderBlock props={site.header} site={site} />
      <main>
        {site.pages.map((page) => (
          <Route key={page.id} route={pageRoute(page)} title={page.name} hidden={!page.isHome}>
            {page.blocks.map((block) => {
              const Block = registry[block.type]?.Component
              if (!Block) return null
              const attrs = animAttrs(block.anim, site.theme)
              if (!attrs) return <Block key={block.id} props={block.props} site={site} />
              return (
                <div key={block.id} {...attrs}>
                  <Block props={block.props} site={site} />
                </div>
              )
            })}
          </Route>
        ))}
        {site.products.map((product) => (
          <Route key={product.id} route={`product/${product.id}`} title={product.name}>
            <ProductDetail product={product} site={site} />
          </Route>
        ))}
        <Route route="cart" title={ui(site, 'cart')}>
          <CartView site={site} />
        </Route>
        <Route route="checkout" title={ui(site, 'checkout')}>
          <CheckoutView site={site} />
        </Route>
        <Route route="404" title={ui(site, 'notFound')}>
          <div className="eb-page">
            <div className="eb-container eb-center">
              <h1 className="eb-heading">{ui(site, 'notFound')}</h1>
              <p className="eb-empty">
                <a className="eb-btn" href="#/">
                  {ui(site, 'backHome')}
                </a>
              </p>
            </div>
          </div>
        </Route>
      </main>
      <FooterBlock props={site.footer} site={site} />
    </div>
  )
}
