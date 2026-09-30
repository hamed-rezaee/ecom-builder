import { useRef } from 'react'
import { Moon, Sun, Trash2, Upload } from 'lucide-react'
import { COLOR_SCHEMES, PRESET_KEYS, STYLE_PRESETS } from '../../data/themePresets'
import { useSiteStore } from '../../store/useSiteStore'
import { toast } from '../../store/toastStore'
import { EASINGS, ENTRANCES, HOVERS, PAGE_TRANSITIONS } from '../../utils/animation'
import { readFontFile } from '../../utils/font'
import { DEFAULT_THEME, MAX_CUSTOM_FONTS } from '../../utils/theme'
import {
  ColorInput,
  FontInput,
  OptionalColor,
  RangeInput,
  SelectInput,
  TextInput,
  Toggle,
} from '../ui/Field'

const WEIGHTS = [[400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extra bold'], [900, 'Black']]
const BUTTON_STYLES = [['solid', 'Solid'], ['outline', 'Outline'], ['soft', 'Soft']]
const BUTTON_SHAPES = [['inherit', 'Match corner radius'], ['square', 'Square'], ['pill', 'Pill']]
const SHADOWS = [['none', 'None'], ['sm', 'Subtle'], ['md', 'Medium'], ['lg', 'Strong']]
const DARK_MODES = [['off', 'Off'], ['toggle', 'Visitor toggle in header'], ['system', 'Follow system setting']]

const DEFAULT_LOOK = Object.fromEntries(PRESET_KEYS.map((k) => [k, DEFAULT_THEME[k]]))

function Section({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen} className="group border-b border-slate-200 pb-3">
      <summary className="cursor-pointer list-none py-1 text-sm font-semibold text-slate-800 marker:hidden">
        {title}
      </summary>
      <div className="mt-3 space-y-4">{children}</div>
    </details>
  )
}

function PresetButton({ preset, onApply, onDelete }) {
  const { primary = DEFAULT_THEME.primary, background = DEFAULT_THEME.background } = preset.theme
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onApply(preset.theme)}
        aria-label={`Apply ${preset.name} preset`}
        className="flex w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-xs hover:border-indigo-400"
      >
        <span
          className="h-5 w-5 shrink-0 rounded-full border border-slate-300"
          style={{ background: `linear-gradient(135deg, ${background} 50%, ${primary} 50%)` }}
        />
        <span className="truncate">{preset.name}</span>
      </button>
      {onDelete && (
        <button
          type="button"
          aria-label={`Delete ${preset.name} preset`}
          onClick={onDelete}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-red-600"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

export default function ThemePanel() {
  const site = useSiteStore((s) => s.site)
  const themePreview = useSiteStore((s) => s.themePreview)
  const updateTheme = useSiteStore((s) => s.updateTheme)
  const updateSiteName = useSiteStore((s) => s.updateSiteName)
  const resetSite = useSiteStore((s) => s.resetSite)
  const saveThemePreset = useSiteStore((s) => s.saveThemePreset)
  const deleteThemePreset = useSiteStore((s) => s.deleteThemePreset)
  const setThemePreview = useSiteStore((s) => s.setThemePreview)
  const fileRef = useRef(null)
  const { theme } = site

  function reset() {
    if (window.confirm('Replace your site with the starter template? This cannot be undone.')) {
      resetSite()
    }
  }

  // Colour schemes only change colours; style presets replace the whole look.
  const applyScheme = (patch) => updateTheme(patch)
  const applyStyle = (patch) => updateTheme({ ...DEFAULT_LOOK, ...patch })

  function savePreset() {
    const name = window.prompt('Name this theme preset', 'My theme')
    if (name !== null) saveThemePreset(name)
  }

  async function uploadFont(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (theme.customFonts.length >= MAX_CUSTOM_FONTS) {
      toast(`You can upload up to ${MAX_CUSTOM_FONTS} fonts. Remove one first.`, { type: 'error' })
      return
    }
    try {
      const font = await readFontFile(file)
      updateTheme({ customFonts: [...theme.customFonts, font], font: `u:${font.id}` })
    } catch (err) {
      toast(err.message, { type: 'error' })
    }
  }

  function removeFont(id) {
    const ref = `u:${id}`
    updateTheme({
      customFonts: theme.customFonts.filter((f) => f.id !== id),
      ...(theme.font === ref ? { font: 'sans' } : {}),
      ...(theme.headingFont === ref ? { headingFont: '' } : {}),
    })
  }

  return (
    <div className="space-y-3 p-4">
      <TextInput label="Site name" value={site.name} onChange={updateSiteName} />

      <Section title="Presets" defaultOpen>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-600">Color schemes</div>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_SCHEMES.map((p) => (
              <PresetButton key={p.name} preset={p} onApply={applyScheme} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-600">Styles (colors, fonts, shape, motion)</div>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map((p) => (
              <PresetButton key={p.name} preset={p} onApply={applyStyle} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-slate-600">My presets</div>
          <div className="grid grid-cols-2 gap-2">
            {site.themePresets.map((p) => (
              <PresetButton
                key={p.id}
                preset={p}
                onApply={applyStyle}
                onDelete={() => deleteThemePreset(p.id)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={savePreset}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Save current look as preset
          </button>
        </div>
      </Section>

      <Section title="Colors">
        <ColorInput label="Brand color" value={theme.primary} onChange={(v) => updateTheme({ primary: v })} />
        <OptionalColor
          label="Accent color"
          value={theme.secondary}
          fallback={theme.primary}
          onChange={(v) => updateTheme({ secondary: v })}
        />
        <ColorInput label="Background" value={theme.background} onChange={(v) => updateTheme({ background: v })} />
        <ColorInput label="Text color" value={theme.text} onChange={(v) => updateTheme({ text: v })} />
        <OptionalColor
          label="Surface (cards, footer)"
          value={theme.surface}
          fallback={theme.background}
          onChange={(v) => updateTheme({ surface: v })}
        />
        <OptionalColor
          label="Borders"
          value={theme.border}
          fallback={theme.background}
          onChange={(v) => updateTheme({ border: v })}
        />
        <OptionalColor
          label="Muted text"
          value={theme.muted}
          fallback={theme.text}
          onChange={(v) => updateTheme({ muted: v })}
        />
      </Section>

      <Section title="Typography">
        <FontInput
          label="Body font"
          value={theme.font}
          customFonts={theme.customFonts}
          onChange={(v) => updateTheme({ font: v })}
        />
        <FontInput
          label="Heading font"
          value={theme.headingFont}
          customFonts={theme.customFonts}
          inheritLabel="Same as body"
          onChange={(v) => updateTheme({ headingFont: v })}
        />
        <SelectInput
          label="Heading weight"
          value={theme.headingWeight}
          options={WEIGHTS}
          onChange={(v) => updateTheme({ headingWeight: Number(v) })}
        />
        <RangeInput
          label="Base font size"
          unit="px"
          value={theme.baseSize}
          min={13}
          max={22}
          onChange={(v) => updateTheme({ baseSize: v })}
        />
        <RangeInput
          label="Line height"
          value={theme.lineHeight}
          min={1.2}
          max={2}
          step={0.05}
          onChange={(v) => updateTheme({ lineHeight: v })}
        />
        <div className="space-y-2">
          <div className="text-xs font-medium text-slate-600">Uploaded fonts</div>
          {theme.customFonts.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-2 text-xs text-slate-700">
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name} font`}
                onClick={() => removeFont(f.id)}
                className="rounded p-1 text-slate-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Upload size={14} /> Upload font (.woff2, .woff, .ttf, .otf)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            hidden
            onChange={uploadFont}
          />
          <p className="text-xs text-slate-500">Up to {MAX_CUSTOM_FONTS} fonts, 500 KB each.</p>
        </div>
      </Section>

      <Section title="Layout and shape">
        <RangeInput
          label="Content width"
          unit="px"
          value={theme.containerWidth}
          min={640}
          max={1600}
          step={20}
          onChange={(v) => updateTheme({ containerWidth: v })}
        />
        <RangeInput
          label="Section spacing"
          unit="px"
          value={theme.sectionSpacing}
          min={16}
          max={160}
          step={4}
          onChange={(v) => updateTheme({ sectionSpacing: v })}
        />
        <RangeInput
          label="Corner radius"
          unit="px"
          value={theme.radius}
          min={0}
          max={32}
          onChange={(v) => updateTheme({ radius: v })}
        />
        <SelectInput
          label="Shadows"
          value={theme.shadow}
          options={SHADOWS}
          onChange={(v) => updateTheme({ shadow: v })}
        />
      </Section>

      <Section title="Buttons">
        <SelectInput
          label="Style"
          value={theme.buttonStyle}
          options={BUTTON_STYLES}
          onChange={(v) => updateTheme({ buttonStyle: v })}
        />
        <SelectInput
          label="Shape"
          value={theme.buttonShape}
          options={BUTTON_SHAPES}
          onChange={(v) => updateTheme({ buttonShape: v })}
        />
      </Section>

      <Section title="Animation">
        <p className="text-xs text-slate-500">
          Defaults for every block. Override per block in the block settings. Play them with Preview.
        </p>
        <SelectInput
          label="Scroll entrance"
          value={theme.animEntrance}
          options={ENTRANCES}
          onChange={(v) => updateTheme({ animEntrance: v })}
        />
        <SelectInput
          label="Hover effect"
          value={theme.animHover}
          options={HOVERS}
          onChange={(v) => updateTheme({ animHover: v })}
        />
        <RangeInput
          label="Duration"
          unit="ms"
          value={theme.animDuration}
          min={100}
          max={3000}
          step={100}
          onChange={(v) => updateTheme({ animDuration: v })}
        />
        <SelectInput
          label="Easing"
          value={theme.animEasing}
          options={EASINGS}
          onChange={(v) => updateTheme({ animEasing: v })}
        />
        <Toggle
          label="Animate only the first time"
          value={theme.animOnce}
          onChange={(v) => updateTheme({ animOnce: v })}
        />
        <SelectInput
          label="Page transition"
          value={theme.pageTransition}
          options={PAGE_TRANSITIONS}
          onChange={(v) => updateTheme({ pageTransition: v })}
        />
      </Section>

      <Section title="Dark mode">
        <SelectInput
          label="Dark mode"
          value={theme.darkMode}
          options={DARK_MODES}
          onChange={(v) => updateTheme({ darkMode: v })}
        />
        {theme.darkMode !== 'off' && (
          <>
            <ColorInput label="Dark background" value={theme.darkBackground} onChange={(v) => updateTheme({ darkBackground: v })} />
            <ColorInput label="Dark text" value={theme.darkText} onChange={(v) => updateTheme({ darkText: v })} />
            <ColorInput label="Dark brand color" value={theme.darkPrimary} onChange={(v) => updateTheme({ darkPrimary: v })} />
            <div className="flex gap-2">
              {[['light', Sun, 'Edit light'], ['dark', Moon, 'Preview dark']].map(([mode, Icon, text]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={themePreview === mode}
                  onClick={() => setThemePreview(mode)}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                    themePreview === mode
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={14} /> {text}
                </button>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section title="Store">
        <TextInput
          label="Currency symbol"
          value={theme.currency}
          maxLength={3}
          onChange={(v) => updateTheme({ currency: v })}
        />
      </Section>

      <div className="pt-2">
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
