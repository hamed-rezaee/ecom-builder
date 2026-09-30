import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'
import { cn } from '../utils/helpers'

export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2"
    >
      <AnimatePresence initial={false}>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          layout
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className={cn(
            'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white shadow-lg',
            t.type === 'error' ? 'bg-red-600' : t.type === 'success' ? 'bg-emerald-600' : 'bg-slate-800',
          )}
        >
          {t.type === 'error' && <CircleAlert size={16} />}
          {t.type === 'success' && <CheckCircle2 size={16} />}
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                t.action.onClick()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <X size={14} />
          </button>
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  )
}
