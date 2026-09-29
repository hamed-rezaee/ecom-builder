import { useCallback } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { ArrowDown, ArrowUp, Copy, GripVertical, Plus, Trash2 } from 'lucide-react'
import '../blocks/blocks.css'
import { registry } from '../blocks/registry'
import { selectPage, useSiteStore } from '../store/useSiteStore'
import { cn, themeVars } from '../utils/helpers'

const DEVICE_WIDTH = { desktop: '100%', tablet: '768px', mobile: '390px' }

function DropLine({ position }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 z-40 h-1 rounded bg-indigo-500 shadow',
        position === 'before' ? '-top-0.5' : '-bottom-0.5',
      )}
    />
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

function CanvasBlock({ block, index, total, selected, isDragging, line }) {
  const { select, moveBlock, duplicateBlock, removeBlock } = useSiteStore.getState()
  const site = useSiteStore((s) => s.site)
  const { attributes, listeners, setNodeRef: setDragRef, setActivatorNodeRef } = useDraggable({
    id: block.id,
    data: { kind: 'block' },
  })
  const { setNodeRef: setDropRef } = useDroppable({ id: block.id })
  const ref = useCallback(
    (node) => {
      setDragRef(node)
      setDropRef(node)
    },
    [setDragRef, setDropRef],
  )
  const { label, Component } = registry[block.type]

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={`${label} block`}
      onClick={(e) => {
        e.stopPropagation()
        select(block.id)
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          select(block.id)
        }
      }}
      className={cn('group relative outline-none', isDragging && 'opacity-40')}
    >
      {line && <DropLine position={line} />}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-10 ring-2 ring-inset transition',
          selected ? 'ring-indigo-500' : 'ring-transparent group-hover:ring-indigo-300',
        )}
      />
      <div
        className={cn(
          'absolute left-2 top-2 z-20 items-center overflow-hidden rounded-md bg-indigo-600 text-xs text-white shadow-md',
          selected ? 'flex' : 'hidden group-hover:flex',
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
        <Component props={block.props} site={site} />
      </div>
    </div>
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
          selected ? 'ring-indigo-500' : 'ring-transparent group-hover:ring-indigo-300',
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

export default function Canvas({ dropIndex, draggingId }) {
  const site = useSiteStore((s) => s.site)
  const page = useSiteStore(selectPage)
  const device = useSiteStore((s) => s.device)
  const selectedId = useSiteStore((s) => s.selectedId)
  const select = useSiteStore((s) => s.select)
  const { setNodeRef: setEndRef, isOver } = useDroppable({ id: 'canvas-end' })
  const empty = page.blocks.length === 0

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-slate-200/70 p-6" onClick={() => select(null)}>
      <div
        className="mx-auto overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5 transition-[max-width] duration-300"
        style={{ maxWidth: DEVICE_WIDTH[device] }}
      >
        <div className="eb-site" style={{ ...themeVars(site.theme), minHeight: 640 }}>
          <GlobalBlock id="header" selected={selectedId === 'header'} />
          {page.blocks.map((block, i) => (
            <CanvasBlock
              key={block.id}
              block={block}
              index={i}
              total={page.blocks.length}
              selected={selectedId === block.id}
              isDragging={draggingId === block.id}
              line={dropIndex === i ? 'before' : dropIndex === page.blocks.length && i === page.blocks.length - 1 ? 'after' : null}
            />
          ))}
          <div
            ref={setEndRef}
            className={cn(
              'relative mx-6 my-6 flex items-center justify-center rounded-lg border-2 border-dashed text-sm transition',
              empty ? 'h-48' : 'h-20',
              isOver ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-300 text-slate-400',
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
