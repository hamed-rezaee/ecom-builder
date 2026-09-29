import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { registry } from '../blocks/registry'
import { selectPage, useSiteStore } from '../store/useSiteStore'
import Canvas from './Canvas'
import Inspector from './Inspector'
import LeftSidebar from './LeftSidebar'

const collision = (args) => {
  const within = pointerWithin(args)
  return within.length ? within : closestCenter(args)
}

function currentBlocks() {
  const state = useSiteStore.getState()
  return selectPage(state).blocks
}

// Insertion index in the current page for a drag event, or null when not over the canvas.
function insertionIndex({ active, over }) {
  if (!over) return null
  const blocks = currentBlocks()
  if (over.id === 'header') return 0
  if (over.id === 'footer' || over.id === 'canvas-end') return blocks.length
  const i = blocks.findIndex((b) => b.id === over.id)
  if (i < 0) return null
  const rect = active.rect.current.translated
  if (!rect) return i
  const center = rect.top + rect.height / 2
  return center > over.rect.top + over.rect.height / 2 ? i + 1 : i
}

export default function Workspace() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )
  const [active, setActive] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)

  const activeLabel = active
    ? registry[active.kind === 'palette' ? active.blockType : active.type].label
    : null

  // Hide the indicator when a dragged block would land where it already is.
  const displayIndex = (event) => {
    const index = insertionIndex(event)
    if (index == null || event.active.data.current?.kind !== 'block') return index
    const from = currentBlocks().findIndex((b) => b.id === event.active.id)
    return index === from || index === from + 1 ? null : index
  }

  const handleStart = ({ active: a }) => {
    const data = a.data.current
    if (data?.kind === 'palette') return setActive({ kind: 'palette', blockType: data.blockType })
    const block = currentBlocks().find((b) => b.id === a.id)
    setActive(block ? { kind: 'block', id: block.id, type: block.type } : null)
    useSiteStore.getState().select(a.id)
  }

  const handleMove = (event) => setDropIndex(displayIndex(event))

  const handleEnd = (event) => {
    const index = displayIndex(event)
    const current = active
    setActive(null)
    setDropIndex(null)
    if (index == null || !current) return
    const { addBlock, moveBlock } = useSiteStore.getState()
    if (current.kind === 'palette') {
      addBlock(current.blockType, index)
      return
    }
    const from = currentBlocks().findIndex((b) => b.id === current.id)
    moveBlock(from, index > from ? index - 1 : index)
  }

  const handleCancel = () => {
    setActive(null)
    setDropIndex(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={handleStart}
      onDragMove={handleMove}
      onDragOver={handleMove}
      onDragEnd={handleEnd}
      onDragCancel={handleCancel}
    >
      <LeftSidebar />
      <Canvas dropIndex={dropIndex} draggingId={active?.kind === 'block' ? active.id : null} />
      <Inspector />
      <DragOverlay dropAnimation={null}>
        {activeLabel && (
          <div className="cursor-grabbing rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-xl">
            {activeLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
