import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Monitor, Smartphone, Tablet, X } from 'lucide-react'
import { buildSite } from '../export/buildSite'
import { useSiteStore } from '../store/useSiteStore'
import { cn } from '../utils/helpers'

const DEVICES = [
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 390 },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 768 },
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: null },
]

export default function PreviewModal({ onClose }) {
  const site = useSiteStore((s) => s.site)
  const [device, setDevice] = useState('desktop')
  const html = useMemo(() => buildSite(site, { inline: true }).html, [site])
  const width = DEVICES.find((d) => d.id === device).width

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function openInTab() {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site preview"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/80"
    >
      <div className="flex h-14 shrink-0 items-center gap-3 bg-slate-900 px-4 text-white">
        <span className="text-sm font-semibold">Preview</span>
        <div className="mx-auto flex gap-1">
          {DEVICES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
              className={cn('rounded-md p-2 hover:bg-white/10', device === id && 'bg-white/20')}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openInTab}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm hover:bg-white/10"
        >
          <ExternalLink size={16} /> Open in tab
        </button>
        <button
          type="button"
          aria-label="Close preview"
          onClick={onClose}
          className="rounded-md p-2 hover:bg-white/10"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-4">
        <iframe
          title="Site preview"
          srcDoc={html}
          sandbox="allow-scripts allow-forms"
          className="h-full rounded-lg bg-white shadow-2xl transition-[width] duration-300"
          style={{ width: width ?? '100%' }}
        />
      </div>
    </div>
  )
}
