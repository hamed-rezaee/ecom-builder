import { useState } from 'react'
import { LayoutTemplate, Package, Palette, Layers } from 'lucide-react'
import { cn } from '../utils/helpers'
import BlocksPanel from './panels/BlocksPanel'
import PagesPanel from './panels/PagesPanel'
import ProductsPanel from './panels/ProductsPanel'
import ThemePanel from './panels/ThemePanel'

const TABS = [
  { id: 'blocks', label: 'Blocks', icon: LayoutTemplate, Panel: BlocksPanel },
  { id: 'pages', label: 'Pages', icon: Layers, Panel: PagesPanel },
  { id: 'products', label: 'Products', icon: Package, Panel: ProductsPanel },
  { id: 'theme', label: 'Theme', icon: Palette, Panel: ThemePanel },
]

export default function LeftSidebar() {
  const [tab, setTab] = useState('blocks')
  const { Panel } = TABS.find((t) => t.id === tab)

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div role="tablist" className="grid grid-cols-4 border-b border-slate-200 bg-white">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex flex-col items-center gap-1 border-b-2 py-2.5 text-[11px] font-medium transition',
              tab === id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        <Panel />
      </div>
    </aside>
  )
}
