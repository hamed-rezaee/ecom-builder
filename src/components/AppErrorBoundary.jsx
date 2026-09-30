import { TriangleAlert } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'

function Crash({ error }) {
  const clearAndReload = () => {
    try {
      localStorage.removeItem('ecom-builder-site')
    } catch {
      // storage unavailable
    }
    window.location.reload()
  }

  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 bg-slate-100 p-8 text-center">
      <TriangleAlert size={36} className="text-amber-500" />
      <h1 className="text-lg font-semibold text-slate-800">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">{error.message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset the site to the starter template? Unsaved work is lost.')) clearAndReload()
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset site data
        </button>
      </div>
    </div>
  )
}

export default function AppErrorBoundary({ children }) {
  return <ErrorBoundary fallback={(props) => <Crash {...props} />}>{children}</ErrorBoundary>
}
