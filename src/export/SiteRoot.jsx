import { registry } from '../blocks/registry'
import { CartView, CheckoutView, ProductDetail } from '../blocks/commerce'
import { pageRoute, themeVars } from '../utils/helpers'

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
    <div className="eb-site" style={themeVars(site.theme)}>
      <HeaderBlock props={site.header} site={site} />
      <main>
        {site.pages.map((page) => (
          <Route key={page.id} route={pageRoute(page)} title={page.name} hidden={!page.isHome}>
            {page.blocks.map((block) => {
              const Block = registry[block.type]?.Component
              return Block ? <Block key={block.id} props={block.props} site={site} /> : null
            })}
          </Route>
        ))}
        {site.products.map((product) => (
          <Route key={product.id} route={`product/${product.id}`} title={product.name}>
            <ProductDetail product={product} site={site} />
          </Route>
        ))}
        <Route route="cart" title="Cart">
          <CartView />
        </Route>
        <Route route="checkout" title="Checkout">
          <CheckoutView />
        </Route>
        <Route route="404" title="Not found">
          <div className="eb-page">
            <div className="eb-container eb-center">
              <h1 className="eb-heading">Page not found</h1>
              <p className="eb-empty">
                <a className="eb-btn" href="#/">
                  Back to home
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
