import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2, TriangleAlert } from 'lucide-react'
import '../blocks/blocks.css'
import { registry } from '../blocks/registry'
import { selectPage, useSiteStore } from '../store/useSiteStore'
import { END_ID } from '../utils/dnd'
import { cn } from '../utils/helpers'
import ErrorBoundary from './ErrorBoundary'
import ThemeStyle from './ThemeStyle'

const DEVICE_WIDTH = { desktop: '100%', tablet: '768px', mobile: '390px' }
const EASE = [0.22, 1, 0.36, 1]

// Shared layoutId makes the indicator glide between insertion points.
function DropIndicator({ position }) {
  return (
    <motion.div
      layoutId="drop-indicator"
      transition={{ type: 'spring', stiffness: 600, damping: 45 }}
      className={cn(
        'pointer-events-none absolute inset-x-0 z-40 h-1 rounded-full bg-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.8)]',
        position === 'before' ? '-top-0.5' : '-bottom-0.5',
      )}
    >
      <span className="absolute left-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-500" />
      <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-500" />
    </motion.div>
  )
}

function BlockCrash({ label, onRemove }) {
  return (
    <div role="alert" className="flex items-center gap-3 bg-amber-50 px-6 py-8 text-sm text-amber-800">
      <TriangleAlert size={18} className="shrink-0" />
      <span className="flex-1">This {label.toLowerCase()} block failed to render. Edit its settings or remove it.</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="pointer-events-auto rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
      >
        Remove
      </button>
    </div>
  )
}

function ToolbarButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'p-1.5 hover:bg-white/20 disabled:opacity-30',
        danger && 'hover:bg-red-500',
      )}
    >
      {children}
    </button>
  )
}

function CanvasBlock({ block, index, total, selected, multi, dragging, layoutEnabled, line }) {
  const { select, toggleSelect, selectRange, moveBlock, duplicateBlock, removeBlock } =
    useSiteStore.getState()
  const site = useSiteStore((s) => s.site)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id, data: { kind: 'block' } })
  const { label, Component } = registry[block.type]

  const activate = (e) => {
    if (e.shiftKey) selectRange(block.id)
    else if (e.ctrlKey || e.metaKey) toggleSelect(block.id)
    else select(block.id)
  }

  return (
    <motion.div
      layout={layoutEnabled ? 'position' : false}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.25, ease: EASE }}
      className="relative"
    >
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      role="button"
      tabIndex={0}
      aria-label={`${label} block`}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation()
        activate(e)
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          activate(e)
        }
      }}
      className={cn(
        'group relative outline-none',
        isDragging && 'opacity-30 grayscale',
      )}
    >
      {line && <DropIndicator position={line} />}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10 ring-2 ring-inset transition-[box-shadow,background-color] duration-150',
          selected ? 'ring-indigo-500' : 'ring-transparent group-focus-visible:ring-indigo-400',
          !selected && !dragging && 'group-hover:ring-indigo-300',
          selected && multi && 'bg-indigo-500/5',
        )}
      />
      <div
        className={cn(
          'absolute left-2 top-2 z-20 flex items-center overflow-hidden rounded-md bg-indigo-600 text-xs text-white shadow-md transition duration-150',
          dragging
            ? 'pointer-events-none opacity-0'
            : selected
              ? 'opacity-100'
              : 'pointer-events-none -translate-y-1 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100',
        )}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label={`Drag ${label} block`}
          onClick={(e) => e.stopPropagation()}
          className="flex cursor-grab touch-none items-center gap-1 py-1.5 pl-1.5 pr-2 hover:bg-white/20"
        >
          <GripVertical size={14} />
          <span className="font-medium">{label}</span>
        </button>
        <ToolbarButton label="Move up" disabled={index === 0} onClick={() => moveBlock(index, index - 1)}>
          <ArrowUp size={14} />
        </ToolbarButton>
        <ToolbarButton label="Move down" disabled={index === total - 1} onClick={() => moveBlock(index, index + 1)}>
          <ArrowDown size={14} />
        </ToolbarButton>
        <ToolbarButton label="Duplicate" onClick={() => duplicateBlock(block.id)}>
          <Copy size={14} />
        </ToolbarButton>
        <ToolbarButton label="Delete" danger onClick={() => removeBlock(block.id)}>
          <Trash2 size={14} />
        </ToolbarButton>
      </div>
      <div className="pointer-events-none select-none">
        <ErrorBoundary
          resetKey={block.props}
          fallback={() => <BlockCrash label={label} onRemove={() => removeBlock(block.id)} />}
        >
          <Component props={block.props} site={site} />
        </ErrorBoundary>
      </div>
    </div>
    </motion.div>
  )
}

function GlobalBlock({ id, selected }) {
  const site = useSiteStore((s) => s.site)
  const select = useSiteStore((s) => s.select)
  const { setNodeRef } = useDroppable({ id })
  const { label, Component } = registry[id]

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      aria-label={`Edit ${label.toLowerCase()}`}
      onClick={(e) => {
        e.stopPropagation()
        select(id)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          select(id)
        }
      }}
      className="group relative outline-none"
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-30 ring-2 ring-inset transition',
          selected ? 'ring-indigo-500' : 'ring-transparent group-hover:ring-indigo-300 group-focus-visible:ring-indigo-400',
        )}
      />
      <span
        className={cn(
          'absolute left-2 top-2 z-30 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white shadow-md',
          selected ? 'block' : 'hidden group-hover:block',
        )}
      >
        {label}
      </span>
      <div className="pointer-events-none select-none">
        <Component props={site[id]} site={site} />
      </div>
    </div>
  )
}

export default function Canvas({ dropIndex, dragKind, layoutEnabled }) {
  const site = useSiteStore((s) => s.site)
  const page = useSiteStore(selectPage)
  const device = useSiteStore((s) => s.device)
  const themePreview = useSiteStore((s) => s.themePreview)
  const selectedId = useSiteStore((s) => s.selectedId)
  const selectedIds = useSiteStore((s) => s.selectedIds)
  const announcement = useSiteStore((s) => s.announcement)
  const select = useSiteStore((s) => s.select)
  const { setNodeRef: setEndRef, isOver } = useDroppable({ id: END_ID })
  const blockIds = useMemo(() => page.blocks.map((b) => b.id), [page.blocks])
  const empty = page.blocks.length === 0
  const dragging = dragKind != null
  const endActive = isOver || (empty && dropIndex === 0)

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-200/70 p-6" onClick={() => select(null)}>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <div
        className="mx-auto overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 transition-[max-width] duration-300"
        style={{ maxWidth: DEVICE_WIDTH[device] }}
      >
        <div
          className="eb-site"
          data-theme={site.theme.darkMode === 'off' ? undefined : themePreview}
          style={{ minHeight: 640 }}
        >
          <ThemeStyle theme={site.theme} />
          <GlobalBlock id="header" selected={selectedId === 'header'} />
          <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
            <motion.div
              key={page.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence initial={false}>
                {page.blocks.map((block, i) => (
                  <CanvasBlock
                    key={block.id}
                    block={block}
                    index={i}
                    total={page.blocks.length}
                    selected={selectedIds.includes(block.id)}
                    multi={selectedIds.length > 1}
                    dragging={dragging}
                    layoutEnabled={layoutEnabled}
                    line={
                      dropIndex === i
                        ? 'before'
                        : dropIndex === page.blocks.length && i === page.blocks.length - 1
                          ? 'after'
                          : null
                    }
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </SortableContext>
          <div
            ref={setEndRef}
            className={cn(
              'relative mx-6 my-6 flex items-center justify-center rounded-lg border-2 border-dashed text-sm transition-all duration-200',
              empty ? 'h-48' : 'h-20',
              endActive
                ? 'scale-[1.02] border-indigo-500 bg-indigo-50 text-indigo-600'
                : dragKind === 'palette'
                  ? 'border-indigo-300 text-indigo-400'
                  : 'border-slate-300 text-slate-400',
            )}
          >
            <Plus size={16} className="mr-1.5" />
            {empty ? 'Drag a block here to start building this page' : 'Drop here to add to the end'}
          </div>
          <GlobalBlock id="footer" selected={selectedId === 'footer'} />
        </div>
      </div>
    </main>
  )
}
