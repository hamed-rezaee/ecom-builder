import { placeholderImage, safeHref, safeSrc } from '../utils/helpers'

export function Hero({ props: p }) {
  const img = safeSrc(p.image)
  return (
    <section
      className={`eb-hero eb-hero-${p.height ?? 'md'}${p.align === 'center' ? ' eb-center' : ''}`}
    >
      {img && (
        <>
          <img className="eb-hero-bg" src={img} alt="" />
          <div className="eb-hero-overlay" />
        </>
      )}
      <div className="eb-container eb-hero-inner">
        {p.heading && <h1>{p.heading}</h1>}
        {p.subheading && <p>{p.subheading}</p>}
        {p.buttonText && (
          <a className="eb-btn" href={safeHref(p.buttonHref)}>
            {p.buttonText}
          </a>
        )}
      </div>
    </section>
  )
}

export function ImageText({ props: p }) {
  return (
    <section className="eb-section">
      <div
        className={`eb-container eb-split${p.imagePosition === 'right' ? ' eb-split-reverse' : ''}`}
      >
        <img src={safeSrc(p.image) || placeholderImage(p.heading)} alt="" />
        <div>
          {p.heading && <h2 className="eb-heading">{p.heading}</h2>}
          {p.text && <p className="eb-text">{p.text}</p>}
          {p.buttonText && (
            <a className="eb-btn" href={safeHref(p.buttonHref)}>
              {p.buttonText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export function Features({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        {p.heading && <h2 className="eb-heading eb-center">{p.heading}</h2>}
        <div className="eb-features">
          {(p.items ?? []).map((item, i) => (
            <div className="eb-feature" key={i}>
              <div className="eb-feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              {item.text && <p>{item.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Testimonials({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        {p.heading && <h2 className="eb-heading eb-center">{p.heading}</h2>}
        <div className="eb-quotes">
          {(p.items ?? []).map((item, i) => (
            <figure className="eb-quote" key={i}>
              <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
              <cite>{item.author}</cite>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Faq({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        {p.heading && <h2 className="eb-heading eb-center">{p.heading}</h2>}
        <div className="eb-faq">
          {(p.items ?? []).map((item, i) => (
            <details key={i}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Newsletter({ props: p }) {
  return (
    <section className="eb-section eb-newsletter">
      <div className="eb-container eb-center">
        {p.heading && <h2 className="eb-heading">{p.heading}</h2>}
        {p.text && <p className="eb-sub">{p.text}</p>}
        <form className="eb-form-row" data-newsletter>
          <input
            className="eb-input"
            type="email"
            required
            placeholder="you@example.com"
            aria-label="Email address"
          />
          <button className="eb-btn" type="submit">
            {p.buttonText}
          </button>
        </form>
      </div>
    </section>
  )
}
