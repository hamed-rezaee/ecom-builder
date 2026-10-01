import {
  mapEmbedUrl,
  placeholderImage,
  safeHref,
  safeSrc,
  videoEmbedUrl,
} from '../utils/helpers'
import {
  CTA_TONES,
  DIVIDER_STYLES,
  IMAGE_SHAPES,
  IMAGE_SIZES,
  MAP_HEIGHTS,
  oneOf,
} from '../utils/wireShapes'

const Heading = ({ p, sub }) =>
  (p.heading || (sub && p[sub])) && (
    <div className="eb-center">
      {p.heading && <h2 className="eb-heading">{p.heading}</h2>}
      {sub && p[sub] && <p className="eb-sub">{p[sub]}</p>}
    </div>
  )

export function Gallery({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} />
        <div className="eb-grid" style={{ '--eb-cols': Number(p.columns) || 3 }}>
          {(p.items ?? []).map((item, i) => (
            <figure className="eb-gallery-item" key={i}>
              <img
                src={safeSrc(item.image) || placeholderImage(item.caption || String(i))}
                alt={item.caption || ''}
                loading="lazy"
              />
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Video({ props: p }) {
  const src = videoEmbedUrl(p.url)
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} />
        {src ? (
          <div className="eb-embed eb-video">
            <iframe
              src={src}
              title={p.heading || 'Video'}
              loading="lazy"
              allow="fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
        ) : (
          <p className="eb-empty">Paste a YouTube or Vimeo link to show a video.</p>
        )}
      </div>
    </section>
  )
}

export function CallToAction({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <div className={`eb-cta eb-cta-${oneOf(CTA_TONES, p.tone, 'primary')} eb-center`}>
          {p.heading && <h2 className="eb-heading">{p.heading}</h2>}
          {p.text && <p className="eb-sub">{p.text}</p>}
          <div className="eb-actions eb-actions-center">
            {p.buttonText && (
              <a className="eb-btn" href={safeHref(p.buttonHref)}>
                {p.buttonText}
              </a>
            )}
            {p.secondaryText && (
              <a className="eb-btn eb-btn-outline" href={safeHref(p.secondaryHref)}>
                {p.secondaryText}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Stats({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} />
        <div className="eb-stats">
          {(p.items ?? []).map((item, i) => (
            <div className="eb-stat" key={i}>
              <div className="eb-stat-value">{item.value}</div>
              <div className="eb-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Pricing({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} sub="subheading" />
        <div className="eb-plans">
          {(p.items ?? []).map((plan, i) => (
            <div className={`eb-plan${plan.highlight ? ' eb-plan-featured' : ''}`} key={i}>
              <h3>{plan.name}</h3>
              <div className="eb-plan-price">
                {plan.price}
                {plan.period && <span>{plan.period}</span>}
              </div>
              <ul>
                {String(plan.features ?? '')
                  .split('\n')
                  .map((f) => f.trim())
                  .filter(Boolean)
                  .map((f, k) => (
                    <li key={k}>{f}</li>
                  ))}
              </ul>
              {plan.buttonText && (
                <a
                  className={`eb-btn${plan.highlight ? '' : ' eb-btn-outline'}`}
                  href={safeHref(plan.buttonHref)}
                >
                  {plan.buttonText}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LogoCloud({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} />
        <div className="eb-logos">
          {(p.items ?? []).map((item, i) => (
            <img
              key={i}
              src={safeSrc(item.image) || placeholderImage(item.name)}
              alt={item.name || ''}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactForm({ props: p }) {
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} sub="text" />
        <form className="eb-form eb-contact" data-contact>
          <label>
            Name
            <input className="eb-input" name="name" type="text" required autoComplete="name" />
          </label>
          <label>
            Email
            <input className="eb-input" name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Message
            <textarea className="eb-input" name="message" rows={5} required />
          </label>
          <button className="eb-btn" type="submit">
            {p.buttonText || 'Send message'}
          </button>
        </form>
      </div>
    </section>
  )
}

export function Divider({ props: p }) {
  const style = oneOf(DIVIDER_STYLES, p.style, 'line')
  return (
    <div className="eb-container">
      <div className={`eb-divider eb-divider-${style}`} role="separator" />
    </div>
  )
}

export function Team({ props: p }) {
  const shape = oneOf(IMAGE_SHAPES, p.imageShape, 'circle')
  const size = oneOf(IMAGE_SIZES, p.imageSize, 'md')
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} />
        <div className="eb-features">
          {(p.items ?? []).map((m, i) => (
            <div className="eb-feature" key={i}>
              <img
                className={`eb-feature-img eb-feature-img-${shape} eb-feature-img-${size}`}
                src={safeSrc(m.image) || placeholderImage(m.name)}
                alt=""
                loading="lazy"
              />
              <h3>{m.name}</h3>
              {m.role && <p>{m.role}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MapEmbed({ props: p }) {
  const src = mapEmbedUrl(p.query)
  const height = oneOf(MAP_HEIGHTS, p.height, 'md')
  return (
    <section className="eb-section">
      <div className="eb-container">
        <Heading p={p} />
        {src ? (
          <div className={`eb-embed eb-map eb-map-${height}`}>
            <iframe
              src={src}
              title={p.heading || 'Map'}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <p className="eb-empty">Enter an address to show a map.</p>
        )}
      </div>
    </section>
  )
}
