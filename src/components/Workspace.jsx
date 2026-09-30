import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import { registry } from '../blocks/registry'
import { selectPage, useSiteStore } from '../store/useSiteStore'
import { collision, pointerY, resolveDropIndex, resolveMove } from '../utils/dnd'
import Canvas from './Canvas'
import Inspector from './Inspector'
import LeftSidebar from './LeftSidebar'

const currentBlocks = () => selectPage(useSiteStore.getState()).blocks

const labelOf = (active) => {
  const data = active.data.current
  if (data?.kind === 'palette') return registry[data.blockType].label
  const block = currentBlocks().find((b) => b.id === active.id)
  return block ? registry[block.type].label : 'Block'
}

const overLabel = (over) => {
  if (!over) return null
  if (over.id === 'header') return 'the header'
  if (over.id === 'footer') return 'the footer'
  if (over.id === 'canvas-end') return 'the end of the page'
  const i = currentBlocks().findIndex((b) => b.id === over.id)
  return i < 0 ? null : `position ${i + 1} of ${currentBlocks().length}`
}

const announcements = {
  onDragStart: ({ active }) => `Picked up ${labelOf(active)}.`,
  onDragOver: ({ active, over }) => {
    const where = overLabel(over)
    return where ? `${labelOf(active)} is over ${where}.` : `${labelOf(active)} is not over a drop area.`
  },
  onDragEnd: ({ active, over }) => {
    const where = overLabel(over)
    return where ? `Dropped ${labelOf(active)} at ${where}.` : `Dropped ${labelOf(active)} outside the page.`
  },
  onDragCancel: ({ active }) => `Cancelled moving ${labelOf(active)}.`,
}

const screenReaderInstructions = {
  draggable:
    'Press space or enter to pick up a block. Use the arrow keys to move it, space or enter to drop, escape to cancel.',
}

const DROP_ANIMATION = { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }

export default function Workspace() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const [active, setActive] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)
  // Kept after the drop so the overlay knows which drop animation to use.
  const [lastKind, setLastKind] = useState(null)
  const [layoutLocked, setLayoutLocked] = useState(false)
  const unlockFrame = useRef(0)

  useEffect(() => () => cancelAnimationFrame(unlockFrame.current), [])

  // dnd-kit animates the drop itself; let framer layout resume once it settles.
  const finish = () => {
    setActive(null)
    setDropIndex(null)
    cancelAnimationFrame(unlockFrame.current)
    unlockFrame.current = requestAnimationFrame(() =>
      requestAnimationFrame(() => setLayoutLocked(false)),
    )
  }

  const handleStart = ({ active: a }) => {
    cancelAnimationFrame(unlockFrame.current)
    setLayoutLocked(true)
    const data = a.data.current
    if (data?.kind === 'palette') {
      setLastKind('palette')
      return setActive({ kind: 'palette', blockType: data.blockType })
    }
    const block = currentBlocks().find((b) => b.id === a.id)
    setLastKind('block')
    setActive(block ? { kind: 'block', id: block.id, type: block.type } : null)
    if (!useSiteStore.getState().selectedIds.includes(a.id)) useSiteStore.getState().select(a.id)
  }

  // Only palette drags show an insertion marker; block drags reorder live via the sortable list.
  const handleMove = (event) => {
    if (event.active.data.current?.kind !== 'palette') return
    const blockIds = currentBlocks().map((b) => b.id)
    const y = pointerY(event) ?? event.active.rect.current.translated?.top
    setDropIndex(
      resolveDropIndex({ overId: event.over?.id, blockIds, overRect: event.over?.rect, y }),
    )
  }

  const handleEnd = (event) => {
    const current = active
    const index = dropIndex
    finish()
    if (!current) return
    const { addBlock, moveBlock } = useSiteStore.getState()
    if (current.kind === 'palette') {
      if (index != null) addBlock(current.blockType, index)
      return
    }
    const blockIds = currentBlocks().map((b) => b.id)
    const move = resolveMove({ activeId: current.id, overId: event.over?.id, blockIds })
    if (move) moveBlock(move.from, move.to)
  }

  const handleCancel = () => finish()

  const Icon = active?.kind === 'palette' ? registry[active.blockType].icon : null
  const activeLabel = active
    ? registry[active.kind === 'palette' ? active.blockType : active.type].label
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      accessibility={{ announcements, screenReaderInstructions }}
      autoScroll={{ acceleration: 14, threshold: { x: 0, y: 0.18 } }}
      onDragStart={handleStart}
      onDragMove={handleMove}
      onDragOver={handleMove}
      onDragEnd={handleEnd}
      onDragCancel={handleCancel}
    >
      <LeftSidebar />
      <Canvas dropIndex={dropIndex} dragKind={active?.kind ?? null} layoutEnabled={!layoutLocked} />
      <Inspector />
      <DragOverlay dropAnimation={lastKind === 'block' ? DROP_ANIMATION : null}>
        {activeLabel && (
          <div className="flex cursor-grabbing items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
            {Icon ? <Icon size={16} /> : <GripVertical size={16} />}
            {activeLabel}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
