import { useState } from 'react'
import { Check, Copy, Home, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSiteStore } from '../../store/useSiteStore'
import { cn } from '../../utils/helpers'

export default function PagesPanel() {
  const pages = useSiteStore((s) => s.site.pages)
  const currentPageId = useSiteStore((s) => s.currentPageId)
  const { setCurrentPage, addPage, renamePage, duplicatePage, deletePage } = useSiteStore()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)

  function submitNew(e) {
    e.preventDefault()
    addPage(newName)
    setNewName('')
  }

  function confirmDelete(page) {
    if (window.confirm(`Delete the page "${page.name}"? You can undo this.`)) deletePage(page.id)
  }

  return (
    <div className="space-y-4 p-4">
      <ul className="space-y-1.5">
        {pages.map((page) => {
          const active = page.id === (pages.find((p) => p.id === currentPageId) ?? pages[0]).id
          return (
            <li
              key={page.id}
              className={cn(
                'group flex items-center gap-2 rounded-lg border px-3 py-2',
                active ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              {page.isHome ? (
                <Home size={15} className="shrink-0 text-slate-400" />
              ) : (
                <span className="w-[15px]" />
              )}
              {editingId === page.id ? (
                <input
                  autoFocus
                  value={page.name}
                  aria-label="Page name"
                  onChange={(e) => renamePage(page.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === 'Escape') && setEditingId(null)}
                  className="min-w-0 flex-1 rounded border border-indigo-300 px-1.5 py-0.5 text-sm focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentPage(page.id)}
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-800"
                >
                  {page.name}
                </button>
              )}
              <div className="flex shrink-0 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label={editingId === page.id ? 'Done renaming' : 'Rename page'}
                  title="Rename"
                  onClick={() => setEditingId(editingId === page.id ? null : page.id)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-200"
                >
                  {editingId === page.id ? <Check size={14} /> : <Pencil size={14} />}
                </button>
                <button
                  type="button"
                  aria-label="Duplicate page"
                  title="Duplicate"
                  onClick={() => duplicatePage(page.id)}
                  className="rounded p-1 text-slate-500 hover:bg-slate-200"
                >
                  <Copy size={14} />
                </button>
                {!page.isHome && (
                  <button
                    type="button"
                    aria-label="Delete page"
                    title="Delete"
                    onClick={() => confirmDelete(page)}
                    className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <form onSubmit={submitNew} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New page name"
          aria-label="New page name"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={14} /> Add
        </button>
      </form>
      <p className="text-xs text-slate-500">
        Header, footer, cart and checkout are shared across pages. Click them on the canvas to edit.
      </p>
    </div>
  )
}
