import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import ShortcutsModal from './components/ShortcutsModal'
import TopBar from './components/TopBar'
import Toasts from './components/Toasts'
import Workspace from './components/Workspace'
import { toast } from './store/toastStore'
import { useSiteStore } from './store/useSiteStore'

const PreviewModal = lazy(() => import('./components/PreviewModal'))

const isTyping = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

const hasTextSelection = () => !window.getSelection()?.isCollapsed

function useShortcuts(onHelp) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || isTyping(e.target)) return
      const store = useSiteStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      const hasBlocks = store.selectedIds.length > 0

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        store.redo()
      } else if (mod && key === 'a') {
        e.preventDefault()
        store.selectAll()
      } else if (mod && key === 'd' && hasBlocks) {
        e.preventDefault()
        store.duplicateBlocks(store.selectedIds)
      } else if (mod && key === 'c' && hasBlocks && !hasTextSelection()) {
        e.preventDefault()
        const n = store.copySelected()
        toast(`Copied ${n} block${n === 1 ? '' : 's'}`)
      } else if (mod && key === 'x' && hasBlocks) {
        e.preventDefault()
        const n = store.cutSelected()
        toast(`Cut ${n} block${n === 1 ? '' : 's'}`)
      } else if (mod && key === 'v' && store.clipboard.length) {
        e.preventDefault()
        store.paste()
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && hasBlocks) {
        e.preventDefault()
        store.moveSelected(e.key === 'ArrowUp' ? -1 : 1)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && hasBlocks) {
        e.preventDefault()
        store.removeBlocks(store.selectedIds)
      } else if (e.key === '?' && !mod) {
        e.preventDefault()
        onHelp()
      } else if (e.key === 'Escape') {
        store.select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onHelp])
}

export default function App() {
  const [previewing, setPreviewing] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const closePreview = useCallback(() => setPreviewing(false), [])
  const openHelp = useCallback(() => setHelpOpen(true), [])
  const closeHelp = useCallback(() => setHelpOpen(false), [])
  useShortcuts(openHelp)

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-800">
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white p-8 text-center text-slate-600 lg:hidden">
        The site builder needs a larger screen. Open it on a laptop or desktop.
      </div>
      <TopBar onPreview={() => setPreviewing(true)} onHelp={openHelp} />
      <div className="flex min-h-0 flex-1">
        <Workspace />
      </div>
      <AnimatePresence>
        {previewing && (
          <Suspense fallback={null}>
            <PreviewModal onClose={closePreview} />
          </Suspense>
        )}
      </AnimatePresence>
      <AnimatePresence>{helpOpen && <ShortcutsModal onClose={closeHelp} />}</AnimatePresence>
      <Toasts />
    </div>
  )
}
