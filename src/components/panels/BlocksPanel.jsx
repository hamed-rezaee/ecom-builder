import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { Search, X } from 'lucide-react'
import { paletteTypes, registry } from '../../blocks/registry'
import { selectPage, useSiteStore } from '../../store/useSiteStore'

function PaletteItem({ type }) {
  const { label, icon: Icon } = registry[type]
  const addBlock = useSiteStore((s) => s.addBlock)
  const page = useSiteStore(selectPage)
  const selectedId = useSiteStore((s) => s.selectedId)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { kind: 'palette', blockType: type },
  })
  // Enter and Space add the block via click; keyboard dragging is for canvas blocks only.
  const pointerListeners = { ...listeners }
  delete pointerListeners.onKeyDown

  const insertAfterSelected = () => {
    const i = page.blocks.findIndex((b) => b.id === selectedId)
    addBlock(type, i >= 0 ? i + 1 : undefined)
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...pointerListeners}
      {...attributes}
      onClick={insertAfterSelected}
      className={`flex touch-none cursor-grab flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition duration-150 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-500 active:scale-95 ${isDragging ? 'opacity-40' : ''}`}
    >
      <Icon size={20} />
      {label}
    </button>
  )
}

export default function BlocksPanel() {
  const [query, setQuery] = useState('')
  const categories = ['Store', 'Content']
  const q = query.trim().toLowerCase()
  const matches = (t) =>
    !q || registry[t].label.toLowerCase().includes(q) || registry[t].category.toLowerCase().includes(q)
  const visible = paletteTypes.filter(matches)

  return (
    <div className="space-y-5 p-4">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          aria-label="Search blocks"
          placeholder="Search blocks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-7 text-sm focus:border-indigo-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Drag a block onto the page, or click to add it.
      </p>
      {visible.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500">No blocks match &ldquo;{query}&rdquo;.</p>
      )}
      {categories.map((category) => {
        const items = visible.filter((t) => registry[t].category === category)
        if (!items.length) return null
        return (
          <section key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {items.map((t) => (
                <PaletteItem key={t} type={t} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
