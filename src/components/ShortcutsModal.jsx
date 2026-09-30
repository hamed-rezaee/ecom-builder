import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const SHORTCUTS = [
  ['Undo / Redo', 'Ctrl+Z / Ctrl+Shift+Z'],
  ['Copy / Cut / Paste blocks', 'Ctrl+C / Ctrl+X / Ctrl+V'],
  ['Duplicate selection', 'Ctrl+D'],
  ['Delete selection', 'Delete'],
  ['Select all blocks', 'Ctrl+A'],
  ['Add to selection', 'Ctrl+Click'],
  ['Select a range', 'Shift+Click'],
  ['Move selection up / down', 'Alt+Up / Alt+Down'],
  ['Pick up focused block', 'Drag handle, then Space'],
  ['Move picked-up block', 'Arrow keys'],
  ['Drop / cancel', 'Space / Esc'],
  ['Deselect', 'Esc'],
  ['Show this help', '?'],
]

export default function ShortcutsModal({ onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Keyboard shortcuts</h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
        <dl className="divide-y divide-slate-100 text-sm">
          {SHORTCUTS.map(([label, keys]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-1.5">
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-mono text-xs text-slate-800">{keys}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </motion.div>
  )
}
