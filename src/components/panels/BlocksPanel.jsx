import { useDraggable } from '@dnd-kit/core'
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

  const insertAfterSelected = () => {
    const i = page.blocks.findIndex((b) => b.id === selectedId)
    addBlock(type, i >= 0 ? i + 1 : undefined)
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={insertAfterSelected}
      className={`flex touch-none cursor-grab flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 hover:shadow ${isDragging ? 'opacity-40' : ''}`}
    >
      <Icon size={20} />
      {label}
    </button>
  )
}

export default function BlocksPanel() {
  const categories = ['Store', 'Content']
  return (
    <div className="space-y-5 p-4">
      <p className="text-xs leading-relaxed text-slate-500">
        Drag a block onto the page, or click to add it.
      </p>
      {categories.map((category) => (
        <section key={category}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {category}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {paletteTypes
              .filter((t) => registry[t].category === category)
              .map((t) => (
                <PaletteItem key={t} type={t} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
