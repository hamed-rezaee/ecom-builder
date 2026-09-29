import { useId, useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { safeSrc } from '../../utils/helpers'
import { readImageFile } from '../../utils/image'
import { toast } from '../../store/toastStore'

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

export function Field({ label, htmlFor, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-600">
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

export function TextInput({ label, value, onChange, placeholder, maxLength }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="text"
        className={inputCls}
        value={value ?? ''}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

export function TextArea({ label, value, onChange, rows = 3 }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className={`${inputCls} resize-y`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  )
}

export function NumberInput({ label, value, onChange, min, max, step = 1 }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="number"
        className={inputCls}
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          if (e.target.value === '') return onChange(min ?? 0)
          const n = Number(e.target.value)
          onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n)))
        }}
      />
    </Field>
  )
}

export function SelectInput({ label, value, onChange, options }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        className={inputCls}
        value={String(value ?? '')}
        onChange={(e) => {
          const picked = options.find(([v]) => String(v) === e.target.value)
          onChange(picked ? picked[0] : e.target.value)
        }}
      >
        {options.map(([v, text]) => (
          <option key={String(v)} value={String(v)}>
            {text}
          </option>
        ))}
      </select>
    </Field>
  )
}

export function ColorInput({ label, value, onChange }) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-0.5"
        />
        <span className="font-mono text-xs uppercase text-slate-500">{value}</span>
      </div>
    </Field>
  )
}

export function Toggle({ label, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-700">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-indigo-600"
      />
    </label>
  )
}

export function ImageInput({ label, value, onChange, maxSize = 1400 }) {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const id = useId()
  const isUpload = (value ?? '').startsWith('data:')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      onChange(await readImageFile(file, maxSize))
    } catch (err) {
      toast(err.message, { type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Field label={label} htmlFor={id}>
      <div className="space-y-2">
        {value && safeSrc(value) && (
          <img
            src={safeSrc(value)}
            alt=""
            className="h-24 w-full rounded-md border border-slate-200 object-cover"
          />
        )}
        <input
          id={id}
          type="text"
          className={`${inputCls} disabled:bg-slate-100`}
          disabled={isUpload}
          value={isUpload ? '' : (value ?? '')}
          placeholder={isUpload ? 'Uploaded image' : 'Paste image URL'}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <ImagePlus size={14} /> {busy ? 'Processing…' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>
    </Field>
  )
}
