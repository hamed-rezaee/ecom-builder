import { formatPrice, productImage } from '../utils/helpers'

export function ProductCard({ product, site, buttonText }) {
  const href = `#/product/${product.id}`
  return (
    <article className="eb-card">
      <a href={href}>
        <img className="eb-card-img" src={productImage(product)} alt={product.name} />
      </a>
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

export function ProductGrid({ props: p, site }) {
  const limit = Number(p.limit) || 0
  const list = limit > 0 ? site.products.slice(0, limit) : site.products
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
          <div className="eb-grid" style={{ '--eb-cols': Number(p.columns) || 3 }}>
            {list.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                site={site}
                buttonText={p.buttonText}
              />
            ))}
          </div>
        ) : (
          <p className="eb-empty">No products yet. Add some in the Products tab.</p>
        )}
      </div>
    </section>
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
