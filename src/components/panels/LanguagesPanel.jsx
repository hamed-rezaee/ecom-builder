import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { selectViewLocale, useSiteStore } from '../../store/useSiteStore'
import { LOCALES, MAX_LOCALES, localeName } from '../../utils/i18n'
import { collectStrings } from '../../utils/translate'
import { SelectInput, TextArea, TextInput } from '../ui/Field'

const options = LOCALES.map(([code, name]) => [code, `${name} (${code})`])

export default function LanguagesPanel() {
  const site = useSiteStore((s) => s.site)
  const updateLocales = useSiteStore((s) => s.updateLocales)
  const setTranslation = useSiteStore((s) => s.setTranslation)
  const setViewLocale = useSiteStore((s) => s.setViewLocale)
  const viewLocale = useSiteStore(selectViewLocale)
  const { locales, translations } = site
  const active = viewLocale || (locales.enabled[0] ?? '')
  const groups = useMemo(() => (active ? collectStrings(site) : []), [site, active])
  const map = translations?.[active] ?? {}
  const done = groups.flatMap((g) => g.items).filter((i) => map[i.key]?.trim()).length
  const total = groups.reduce((n, g) => n + g.items.length, 0)

  return (
    <div className="space-y-5 p-4">
      <SelectInput
        label="Default language (what you edit)"
        value={locales.default}
        options={options}
        onChange={(v) => updateLocales({ default: v })}
      />

      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-600">Additional languages</div>
        {locales.enabled.map((code) => (
          <div key={code} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
            <span>
              {localeName(code)} <span className="text-slate-400">({code})</span>
            </span>
            <button
              type="button"
              aria-label={`Remove ${localeName(code)}`}
              className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-red-600"
              onClick={() => updateLocales({ enabled: locales.enabled.filter((c) => c !== code) })}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {locales.enabled.length < MAX_LOCALES && (
          <SelectInput
            label="Add language"
            value=""
            options={[['', 'Choose...'], ...options.filter(([c]) => c !== locales.default && !locales.enabled.includes(c))]}
            onChange={(code) => {
              if (!code) return
              updateLocales({ enabled: [...locales.enabled, code] })
              setViewLocale(code)
            }}
          />
        )}
        <p className="text-xs text-slate-500">
          Each language is exported to its own folder (for example /fr/) with a language switcher in the header.
        </p>
      </div>

      {active && (
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <SelectInput
            label="Translate to"
            value={active}
            options={locales.enabled.map((c) => [c, localeName(c)])}
            onChange={setViewLocale}
          />
          <p className="text-xs text-slate-500">
            {done} of {total} translated. Empty fields fall back to {localeName(locales.default)}.
          </p>
          {groups.map((g) => (
            <section key={g.title} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</h3>
              {g.items.map((item) => {
                const Input = item.multiline ? TextArea : TextInput
                return (
                  <Input
                    key={`${active}:${item.key}`}
                    label={item.source.length > 70 ? `${item.source.slice(0, 70)}...` : item.source}
                    value={map[item.key] ?? ''}
                    onChange={(v) => setTranslation(active, item.key, v)}
                  />
                )
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
