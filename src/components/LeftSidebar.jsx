import { useState } from 'react'
import { motion } from 'framer-motion'
import { Languages, LayoutTemplate, Package, Palette, Layers } from 'lucide-react'
import { cn } from '../utils/helpers'
import BlocksPanel from './panels/BlocksPanel'
import LanguagesPanel from './panels/LanguagesPanel'
import PagesPanel from './panels/PagesPanel'
import ProductsPanel from './panels/ProductsPanel'
import ThemePanel from './panels/ThemePanel'

const TABS = [
  { id: 'blocks', label: 'Blocks', icon: LayoutTemplate, Panel: BlocksPanel },
  { id: 'pages', label: 'Pages', icon: Layers, Panel: PagesPanel },
  { id: 'products', label: 'Products', icon: Package, Panel: ProductsPanel },
  { id: 'theme', label: 'Theme', icon: Palette, Panel: ThemePanel },
  { id: 'languages', label: 'Languages', icon: Languages, Panel: LanguagesPanel },
]

export default function LeftSidebar() {
  const [tab, setTab] = useState('blocks')
  const { Panel } = TABS.find((t) => t.id === tab)

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <div role="tablist" className="grid grid-cols-5 border-b border-slate-200 bg-white">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500',
              tab === id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            <Icon size={18} />
            {label}
            {tab === id && (
              <motion.span
                layoutId="sidebar-tab"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600"
              />
            )}
          </button>
        ))}
      </div>
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.16 }}
        className="flex-1 overflow-y-auto"
      >
        <Panel />
      </motion.div>
    </aside>
  )
}
