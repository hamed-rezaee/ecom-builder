import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import TopBar from './components/TopBar'
import Toasts from './components/Toasts'
import Workspace from './components/Workspace'
import { useSiteStore } from './store/useSiteStore'

const PreviewModal = lazy(() => import('./components/PreviewModal'))

const isTyping = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

const isBlockId = (id) => id && !['header', 'footer'].includes(id)

function useShortcuts() {
  useEffect(() => {
    const onKey = (e) => {
      const store = useSiteStore.getState()
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (isTyping(e.target)) return

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
      } else if (mod && key === 'y') {
        e.preventDefault()
        store.redo()
      } else if (mod && key === 'd' && isBlockId(store.selectedId)) {
        e.preventDefault()
        store.duplicateBlock(store.selectedId)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && isBlockId(store.selectedId)) {
        e.preventDefault()
        store.removeBlock(store.selectedId)
      } else if (e.key === 'Escape') {
        store.select(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  const [previewing, setPreviewing] = useState(false)
  const closePreview = useCallback(() => setPreviewing(false), [])
  useShortcuts()

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-800">
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white p-8 text-center text-slate-600 lg:hidden">
        The site builder needs a larger screen. Open it on a laptop or desktop.
      </div>
      <TopBar onPreview={() => setPreviewing(true)} />
      <div className="flex min-h-0 flex-1">
        <Workspace />
      </div>
      {previewing && (
        <Suspense fallback={null}>
          <PreviewModal onClose={closePreview} />
        </Suspense>
      )}
      <Toasts />
    </div>
  )
}
