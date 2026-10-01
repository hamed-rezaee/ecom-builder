import { formatPrice, productImage } from '../utils/helpers'

// Hidden until the runtime finds this product in the cart.
function InCartBadge({ id }) {
  return <span className="eb-in-cart" data-in-cart={id} hidden />
}

export function ProductCard({ product, site, buttonText, showInCart = true, hidden = false }) {
  const href = `#/product/${product.id}`
  return (
    <article className="eb-card" hidden={hidden}>
      <div className="eb-card-media">
        <a href={href}>
          <img className="eb-card-img" src={productImage(product)} alt={product.name} />
        </a>
        {showInCart && <InCartBadge id={product.id} />}
      </div>
      <div className="eb-card-body">
        <a className="eb-card-title" href={href}>
          {product.name}
        </a>
        <span className="eb-price">{formatPrice(product.price, site.theme.currency)}</span>
        <div className="eb-card-actions">
          <button
            type="button"
            className="eb-btn eb-btn-sm"
            data-add-to-cart={product.id}
          >
            {buttonText || 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  )
}

const PAGINATION_STYLES = ['pages', 'loadmore', 'none']

export function ProductGrid({ props: p, site }) {
  const perPage = Math.max(0, Math.floor(Number(p.perPage)) || 0)
  const style = PAGINATION_STYLES.includes(p.paginationStyle) ? p.paginationStyle : 'pages'
  const all = site.products
  const list = perPage > 0 && style === 'none' ? all.slice(0, perPage) : all
  const paged = perPage > 0 && style !== 'none' && list.length > perPage
  const pageCount = paged ? Math.ceil(list.length / perPage) : 1
  return (
    <section className="eb-section">
      <div className="eb-container">
        {(p.heading || p.subheading) && (
          <div className="eb-center">
            {p.heading && <h2 className="eb-heading">{p.heading}</h2>}
            {p.subheading && <p className="eb-sub">{p.subheading}</p>}
          </div>
        )}
        {list.length ? (
          <div
            {...(paged && {
              'data-paged': '',
              'data-style': style,
              'data-per': perPage,
              'data-page': 1,
            })}
          >
            <div className="eb-grid" style={{ '--eb-cols': Number(p.columns) || 3 }}>
              {list.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  site={site}
                  buttonText={p.buttonText}
                  showInCart={p.showInCart !== false}
                  hidden={paged && i >= perPage}
                />
              ))}
            </div>
            {paged && <Pager style={style} pageCount={pageCount} />}
          </div>
        ) : (
          <p className="eb-empty">No products yet. Add some in the Products tab.</p>
        )}
      </div>
    </section>
  )
}

function Pager({ style, pageCount }) {
  if (style === 'loadmore') {
    return (
      <div className="eb-pager">
        <button type="button" className="eb-btn eb-btn-outline" data-pager-go="more">
          Load more
        </button>
      </div>
    )
  }
  return (
    <nav className="eb-pager" aria-label="Product pages">
      <button type="button" className="eb-page-btn" data-pager-go="prev" disabled>
        Previous
      </button>
      {Array.from({ length: pageCount }, (_, i) => (
        <button
          key={i}
          type="button"
          className="eb-page-btn"
          data-pager-go={i + 1}
          aria-label={`Page ${i + 1}`}
          aria-current={i === 0 ? 'page' : undefined}
        >
          {i + 1}
        </button>
      ))}
      <button type="button" className="eb-page-btn" data-pager-go="next">
        Next
      </button>
    </nav>
  )
}

export function FeaturedProduct({ props: p, site }) {
  const product = site.products.find((x) => x.id === p.productId) ?? site.products[0]
  if (!product) {
    return (
      <section className="eb-section">
        <p className="eb-empty">Add a product to feature it here.</p>
      </section>
    )
  }
  return (
    <section className="eb-section">
      <div className="eb-container eb-split">
        <img src={productImage(product)} alt={product.name} />
        <div>
          {p.label && <div className="eb-eyebrow">{p.label}</div>}
          <h2 className="eb-heading">{product.name}</h2>
          <p className="eb-price" style={{ fontSize: '1.4rem', marginTop: 8 }}>
            {formatPrice(product.price, site.theme.currency)}
          </p>
          <InCartBadge id={product.id} />
          {product.description && <p className="eb-text">{product.description}</p>}
          <div className="eb-actions">
            <button type="button" className="eb-btn" data-add-to-cart={product.id}>
              Add to cart
            </button>
            <a className="eb-btn eb-btn-outline" href={`#/product/${product.id}`}>
              View details
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ProductDetail({ product, site }) {
  return (
    <div className="eb-page">
      <div className="eb-container">
        <a className="eb-back" href="#/">
          &larr; Continue shopping
        </a>
        <div className="eb-detail">
          <img src={productImage(product)} alt={product.name} />
          <div>
            <h1>{product.name}</h1>
            <span className="eb-price">{formatPrice(product.price, site.theme.currency)}</span>
            <InCartBadge id={product.id} />
            {product.description && <p className="eb-text" style={{ marginTop: 0 }}>{product.description}</p>}
            <div className="eb-actions">
              <button type="button" className="eb-btn" data-add-to-cart={product.id}>
                Add to cart
              </button>
              <a className="eb-btn eb-btn-outline" href="#/cart">
                View cart
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CartView() {
  return (
    <div className="eb-page">
      <div className="eb-container">
        <h1 className="eb-heading">Your cart</h1>
        <div data-cart-view />
      </div>
    </div>
  )
}

export function CheckoutView() {
  return (
    <div className="eb-page">
      <div className="eb-container">
        <h1 className="eb-heading">Checkout</h1>
        <div data-checkout-view />
      </div>
    </div>
  )
}
