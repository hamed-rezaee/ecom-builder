import { Copy, Layers, MousePointerClick, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { registry } from '../blocks/registry'
import { selectPage, useSiteStore } from '../store/useSiteStore'
import FieldRenderer from './FieldRenderer'

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
      <MousePointerClick size={32} className="text-slate-300" />
      <p className="text-sm font-medium text-slate-700">Nothing selected</p>
      <p className="text-xs leading-relaxed">
        Click any section on the canvas to edit its content and settings here.
        Shift-click or Ctrl-click to select several.
      </p>
    </div>
  )
}

function BulkState({ count }) {
  const act = (name) => () => {
    const state = useSiteStore.getState()
    state[name](state.selectedIds)
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
      <Layers size={32} className="text-indigo-300" />
      <p className="text-sm font-medium text-slate-700">{count} blocks selected</p>
      <p className="text-xs leading-relaxed">Alt+Up / Alt+Down moves them. Ctrl+C, Ctrl+X and Ctrl+V copy, cut and paste.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={act('duplicateBlocks')}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <Copy size={14} /> Duplicate
        </button>
        <button
          type="button"
          onClick={act('removeBlocks')}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  )
}

export default function Inspector() {
  const site = useSiteStore((s) => s.site)
  const page = useSiteStore(selectPage)
  const selectedId = useSiteStore((s) => s.selectedId)
  const selectedCount = useSiteStore((s) => s.selectedIds.length)
  const updateProps = useSiteStore((s) => s.updateProps)
  const duplicateBlock = useSiteStore((s) => s.duplicateBlock)
  const removeBlock = useSiteStore((s) => s.removeBlock)

  const isGlobal = selectedId === 'header' || selectedId === 'footer'
  const block = isGlobal ? null : page.blocks.find((b) => b.id === selectedId)
  const type = isGlobal ? selectedId : block?.type
  const props = isGlobal ? site[selectedId] : block?.props

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      {selectedCount > 1 ? (
        <BulkState count={selectedCount} />
      ) : !type ? (
        <EmptyState />
      ) : (
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">{registry[type].label}</h2>
            {!isGlobal && (
              <div className="flex gap-1">
                <button
                  type="button"
                  title="Duplicate (Ctrl+D)"
                  aria-label="Duplicate block"
                  onClick={() => duplicateBlock(selectedId)}
                  className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                >
                  <Copy size={16} />
                </button>
                <button
                  type="button"
                  title="Delete (Del)"
                  aria-label="Delete block"
                  onClick={() => removeBlock(selectedId)}
                  className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {registry[type].fields.map((field) => (
              <FieldRenderer
                key={`${selectedId}:${field.key}`}
                field={field}
                value={props[field.key]}
                onChange={(v) => updateProps(selectedId, { [field.key]: v })}
              />
            ))}
          </div>
        </motion.div>
      )}
    </aside>
  )
}
