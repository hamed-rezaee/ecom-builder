import { useSiteStore } from '../../store/useSiteStore'
import { FONTS } from '../../utils/helpers'
import { ColorInput, NumberInput, SelectInput, TextInput } from '../ui/Field'

const PRESETS = [
  { name: 'Indigo', primary: '#4f46e5', background: '#ffffff', text: '#111827' },
  { name: 'Emerald', primary: '#059669', background: '#ffffff', text: '#0f172a' },
  { name: 'Rose', primary: '#e11d48', background: '#fff8f8', text: '#1f1720' },
  { name: 'Warm', primary: '#c2410c', background: '#fffaf5', text: '#3b2f2f' },
  { name: 'Midnight', primary: '#38bdf8', background: '#0f172a', text: '#f1f5f9' },
]

export default function ThemePanel() {
  const site = useSiteStore((s) => s.site)
  const updateTheme = useSiteStore((s) => s.updateTheme)
  const updateSiteName = useSiteStore((s) => s.updateSiteName)
  const resetSite = useSiteStore((s) => s.resetSite)
  const { theme } = site

  function reset() {
    if (window.confirm('Replace your site with the starter template? This cannot be undone.')) {
      resetSite()
    }
  }

  return (
    <div className="space-y-5 p-4">
      <TextInput label="Site name" value={site.name} onChange={updateSiteName} />

      <div>
        <div className="mb-2 text-xs font-medium text-slate-600">Color presets</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              title={p.name}
              aria-label={`Apply ${p.name} preset`}
              onClick={() =>
                updateTheme({ primary: p.primary, background: p.background, text: p.text })
              }
              className="h-9 w-9 overflow-hidden rounded-full border border-slate-300 shadow-sm hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${p.background} 50%, ${p.primary} 50%)` }}
            />
          ))}
        </div>
      </div>

      <ColorInput label="Brand color" value={theme.primary} onChange={(v) => updateTheme({ primary: v })} />
      <ColorInput label="Background" value={theme.background} onChange={(v) => updateTheme({ background: v })} />
      <ColorInput label="Text color" value={theme.text} onChange={(v) => updateTheme({ text: v })} />
      <SelectInput
        label="Font"
        value={theme.font}
        onChange={(v) => updateTheme({ font: v })}
        options={Object.entries(FONTS).map(([key, f]) => [key, f.label])}
      />
      <NumberInput
        label="Corner radius (px)"
        value={theme.radius}
        min={0}
        max={32}
        onChange={(v) => updateTheme({ radius: v })}
      />
      <TextInput
        label="Currency symbol"
        value={theme.currency}
        maxLength={3}
        onChange={(v) => updateTheme({ currency: v })}
      />

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Reset to starter template
        </button>
      </div>
    </div>
  )
}
