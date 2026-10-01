import { Moon, ShoppingBag, Sun } from 'lucide-react'
import { safeHref } from '../utils/helpers'
import { localeName, ui } from '../utils/i18n'

export function Header({ props: p, site }) {
  const enabled = site?.locales?.enabled ?? []
  // Export builds hrefs to the language folders; the editor and inline preview use bare language codes.
  const langSwitch =
    p.showLanguage === false
      ? null
      : (site?.langSwitch ??
        (enabled.length
          ? {
              current: site.locale ?? site.locales.default,
              options: [site.locales.default, ...enabled].map((c) => [c, localeName(c)]),
            }
          : null))
  return (
    <>
      {p.announcement && <div className="eb-announce">{p.announcement}</div>}
      <header className={`eb-header${p.sticky ? ' eb-header-sticky' : ''}`}>
        <div className="eb-container eb-header-inner">
          <a className="eb-logo" href="#/">
            {p.logoText}
          </a>
          <nav className="eb-nav" aria-label="Main">
            {(p.links ?? []).map((l, i) => (
              <a key={i} href={safeHref(l.href)}>
                {l.label}
              </a>
            ))}
            {site?.theme?.darkMode === 'toggle' && (
              <button
                type="button"
                className="eb-theme-toggle"
                data-theme-toggle
                aria-label="Toggle dark mode"
              >
                <Moon className="eb-theme-moon" size={18} aria-hidden="true" />
                <Sun className="eb-theme-sun" size={18} aria-hidden="true" />
              </button>
            )}
            {langSwitch && (
              <select className="eb-currency" data-lang-switcher aria-label={ui(site, 'language')} defaultValue={langSwitch.current}>
                {langSwitch.options.map(([href, label]) => (
                  <option key={href} value={href}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            {site?.theme?.currencies?.length > 0 && (
              <select className="eb-currency" data-currency-switcher aria-label={ui(site, 'currency')} defaultValue={site.theme.currency}>
                {[site.theme.currency, ...site.theme.currencies.map((c) => c.code)].map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            )}
            {p.showCart && (
              <a className="eb-cart-link" href="#/cart" aria-label={ui(site, 'cart')}>
                <ShoppingBag size={20} aria-hidden="true" />
                <span className="eb-cart-count" data-cart-count>
                  0
                </span>
              </a>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}

export function Footer({ props: p, site }) {
  return (
    <footer className="eb-footer">
      <div className="eb-container eb-footer-inner">
        <div>
          <div className="eb-logo">{site.header.logoText}</div>
          {p.about && <p>{p.about}</p>}
        </div>
        <nav aria-label="Footer">
          {(p.links ?? []).map((l, i) => (
            <a key={i} href={safeHref(l.href)}>
              {l.label}
            </a>
          ))}
        </nav>
        {p.copyright && <p className="eb-copy">{p.copyright}</p>}
      </div>
    </footer>
  )
}

export function RichText({ props: p }) {
  return (
    <section className="eb-section">
      <div className={`eb-container${p.align === 'center' ? ' eb-center' : ''}`}>
        {p.heading && <h2 className="eb-heading">{p.heading}</h2>}
        {p.body && <p className="eb-text">{p.body}</p>}
      </div>
    </section>
  )
}

export function Banner({ props: p }) {
  const tone = p.tone === 'dark' || p.tone === 'light' ? ` eb-banner-${p.tone}` : ''
  return (
    <section className={`eb-banner${tone}`}>
      <div className="eb-container eb-banner-inner">
        {p.text && <p>{p.text}</p>}
        {p.buttonText && (
          <a className="eb-btn" href={safeHref(p.buttonHref)}>
            {p.buttonText}
          </a>
        )}
      </div>
    </section>
  )
}

export function Spacer({ props: p }) {
  return <div style={{ height: Number(p.height) || 40 }} aria-hidden="true" />
}
