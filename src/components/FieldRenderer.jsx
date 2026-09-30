import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useSiteStore } from '../store/useSiteStore'
import { linkOptions } from '../utils/helpers'
import {
  ColorInput,
  ImageInput,
  NumberInput,
  RangeInput,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from './ui/Field'

const CUSTOM = '__custom__'

function LinkField({ label, value, onChange }) {
  const site = useSiteStore((s) => s.site)
  const options = linkOptions(site)
  const known = options.some(([href]) => href === value)
  return (
    <div className="space-y-1.5">
      <SelectInput
        label={label}
        value={known ? value : CUSTOM}
        onChange={(v) => onChange(v === CUSTOM ? 'https://' : v)}
        options={[...options, [CUSTOM, 'Custom URL…']]}
      />
      {!known && (
        <TextInput value={value} onChange={onChange} placeholder="https://example.com" />
      )}
    </div>
  )
}

function ProductField({ label, value, onChange }) {
  const products = useSiteStore((s) => s.site.products)
  return (
    <SelectInput
      label={label}
      value={products.some((p) => p.id === value) ? value : (products[0]?.id ?? '')}
      onChange={onChange}
      options={products.length ? products.map((p) => [p.id, p.name]) : [['', 'No products yet']]}
    />
  )
}

function IconButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 ${danger ? 'hover:text-red-600' : ''}`}
    >
      {children}
    </button>
  )
}

function ListField({ field, value = [], onChange }) {
  const update = (i, patch) => onChange(value.map((item, k) => (k === i ? { ...item, ...patch } : item)))
  const move = (i, dir) => {
    const next = [...value]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-600">{field.label}</div>
      {value.map((item, i) => (
        <div key={i} className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {field.itemLabel} {i + 1}
            </span>
            <div className="flex">
              <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp size={14} />
              </IconButton>
              <IconButton label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown size={14} />
              </IconButton>
              <IconButton label="Remove" danger onClick={() => onChange(value.filter((_, k) => k !== i))}>
                <Trash2 size={14} />
              </IconButton>
            </div>
          </div>
          {field.itemFields.map((f) => (
            <FieldRenderer
              key={f.key}
              field={f}
              value={item[f.key]}
              onChange={(v) => update(i, { [f.key]: v })}
            />
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, structuredClone(field.newItem)])}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
      >
        <Plus size={14} /> Add {field.itemLabel.toLowerCase()}
      </button>
    </div>
  )
}

export default function FieldRenderer({ field, value, onChange }) {
  const { label, type } = field
  switch (type) {
    case 'textarea':
      return <TextArea label={label} value={value} onChange={onChange} />
    case 'number':
      return <NumberInput label={label} value={value} onChange={onChange} min={field.min} max={field.max} />
    case 'select':
      return <SelectInput label={label} value={value} onChange={onChange} options={field.options} />
    case 'toggle':
      return <Toggle label={label} value={value} onChange={onChange} />
    case 'color':
      return <ColorInput label={label} value={value} onChange={onChange} />
    case 'range':
      return <RangeInput label={label} value={value} onChange={onChange} min={field.min} max={field.max} />
    case 'image':
      return <ImageInput label={label} value={value} onChange={onChange} />
    case 'link':
      return <LinkField label={label} value={value} onChange={onChange} />
    case 'product':
      return <ProductField label={label} value={value} onChange={onChange} />
    case 'list':
      return <ListField field={field} value={value} onChange={onChange} />
    default:
      return <TextInput label={label} value={value} onChange={onChange} />
  }
}
