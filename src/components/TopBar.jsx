import { useRef, useState } from 'react'
import {
  CircleAlert,
  CircleCheck,
  Download,
  Eye,
  FileDown,
  FileUp,
  Keyboard,
  LoaderCircle,
  Monitor,
  Redo2,
  Smartphone,
  Store,
  Tablet,
  Undo2,
} from 'lucide-react'
import { useSaveStatus } from '../store/saveStatus'
import { MAX_IMPORT_BYTES, downloadSiteJson, parseSiteFile } from '../export/siteJson'
import { selectPage, selectViewLocale, useSiteStore } from '../store/useSiteStore'
import { toast } from '../store/toastStore'
import { cn } from '../utils/helpers'
import { localeName } from '../utils/i18n'

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'mobile', label: 'Mobile', icon: Smartphone },
]

function IconButton({ label, onClick, disabled, active, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent',
        active && 'bg-indigo-50 text-indigo-600',
      )}
    >
      {children}
    </button>
  )
}

function SaveIndicator() {
  const status = useSaveStatus((s) => s.status)
  const map = {
    saved: { icon: CircleCheck, text: 'Saved', tone: 'text-emerald-600' },
    saving: { icon: LoaderCircle, text: 'Saving…', tone: 'text-slate-500', spin: true },
    error: { icon: CircleAlert, text: 'Not saved', tone: 'text-red-600' },
  }
  const { icon: Icon, text, tone, spin } = map[status]
  return (
    <span role="status" className={cn('inline-flex items-center gap-1 text-xs font-medium', tone)}>
      <Icon size={14} className={spin ? 'animate-spin' : undefined} />
      {text}
    </span>
  )
}

export default function TopBar({ onPreview, onHelp }) {
  const site = useSiteStore((s) => s.site)
  const page = useSiteStore(selectPage)
  const device = useSiteStore((s) => s.device)
  const canUndo = useSiteStore((s) => s.past.length > 0)
  const canRedo = useSiteStore((s) => s.future.length > 0)
  const { setDevice, setCurrentPage, undo, redo, updateSiteName, setViewLocale } = useSiteStore()
  const viewLocale = useSiteStore(selectViewLocale)
  const [exporting, setExporting] = useState(false)
  const fileRef = useRef(null)

  async function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('File is larger than 10 MB.')
      const imported = parseSiteFile(await file.text())
      useSiteStore.getState().importSite(imported)
      toast('Site imported.', { type: 'success', action: { label: 'Undo', onClick: undo } })
    } catch (err) {
      toast(`Import failed: ${err.message}`, { type: 'error' })
    }
  }

  function handleExportJson() {
    downloadSiteJson(useSiteStore.getState().site)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const { exportSiteZip } = await import('../export/exportZip')
      await exportSiteZip(useSiteStore.getState().site)
      toast('Site exported. Unzip it and open index.html.', { type: 'success' })
    } catch (err) {
      toast(`Export failed: ${err.message}`, { type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Store size={18} />
        </div>
        <input
          aria-label="Site name"
          value={site.name}
          onChange={(e) => updateSiteName(e.target.value)}
          className="w-44 rounded-md border border-transparent px-2 py-1 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <select
        aria-label="Current page"
        value={page.id}
        onChange={(e) => setCurrentPage(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
      >
        {site.pages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {site.locales.enabled.length > 0 && (
        <select
          aria-label="Language"
          value={viewLocale || site.locales.default}
          onChange={(e) => setViewLocale(e.target.value === site.locales.default ? '' : e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {[site.locales.default, ...site.locales.enabled].map((code) => (
            <option key={code} value={code}>
              {localeName(code)}
            </option>
          ))}
        </select>
      )}

      <div className="mx-auto flex items-center gap-1">
        {DEVICES.map(({ id, label, icon: Icon }) => (
          <IconButton key={id} label={label} active={device === id} onClick={() => setDevice(id)}>
            <Icon size={18} />
          </IconButton>
        ))}
        <span className="mx-2 h-5 w-px bg-slate-200" />
        <IconButton label="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}>
          <Undo2 size={18} />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" disabled={!canRedo} onClick={redo}>
          <Redo2 size={18} />
        </IconButton>
      </div>

      <SaveIndicator />
      <div className="flex items-center gap-0.5">
        <IconButton label="Import site JSON" onClick={() => fileRef.current?.click()}>
          <FileUp size={18} />
        </IconButton>
        <IconButton label="Export site JSON (backup)" onClick={handleExportJson}>
          <FileDown size={18} />
        </IconButton>
        <IconButton label="Keyboard shortcuts (?)" onClick={onHelp}>
          <Keyboard size={18} />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={handleImport}
        />
      </div>
      <button
        type="button"
        onClick={onPreview}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <Eye size={16} /> Preview
      </button>
      <button
        type="button"
        disabled={exporting}
        onClick={handleExport}
        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        <Download size={16} /> {exporting ? 'Exporting…' : 'Export'}
      </button>
    </header>
  )
}
