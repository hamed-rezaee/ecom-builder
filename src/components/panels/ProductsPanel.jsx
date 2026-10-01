import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useSiteStore } from '../../store/useSiteStore'
import { toast } from '../../store/toastStore'
import { formatPrice, productImage } from '../../utils/helpers'
import { ImageInput, ImageListInput, NumberInput, TextArea, TextInput } from '../ui/Field'
import { SortableItem, SortableList } from '../ui/Sortable'

function ProductRow({ product, open, onToggle }) {
  const currency = useSiteStore((s) => s.site.theme.currency)
  const updateProduct = useSiteStore((s) => s.updateProduct)
  const removeProduct = useSiteStore((s) => s.removeProduct)

  function remove() {
    removeProduct(product.id)
    toast(`Deleted "${product.name}"`, {
      action: { label: 'Undo', onClick: () => useSiteStore.getState().undo() },
    })
  }

  return (
    <SortableItem id={product.id} label={product.name} className="rounded-lg border border-slate-200 bg-white">
      {(handle) => (
        <>
      <div className="flex items-center">
      <span className="pl-1.5">{handle}</span>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left"
      >
        <img src={productImage(product)} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">{product.name}</span>
          <span className="block text-xs text-slate-500">{formatPrice(product.price, currency)}</span>
        </span>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      </div>
      {open && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          <TextInput label="Name" value={product.name} onChange={(v) => updateProduct(product.id, { name: v })} />
          <NumberInput
            label="Price"
            value={product.price}
            min={0}
            max={1000000}
            step={0.01}
            onChange={(v) => updateProduct(product.id, { price: v })}
          />
          <TextInput
            label="Short description (shown on product cards)"
            value={product.shortDescription ?? ''}
            maxLength={120}
            onChange={(v) => updateProduct(product.id, { shortDescription: v })}
          />
          <TextArea
            label="Description"
            value={product.description}
            onChange={(v) => updateProduct(product.id, { description: v })}
          />
          <ImageInput
            label="Image"
            value={product.image}
            maxSize={900}
            onChange={(v) => updateProduct(product.id, { image: v })}
          />
          <ImageListInput
            label="More images (gallery)"
            value={product.images}
            onChange={(v) => updateProduct(product.id, { images: v })}
          />
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline"
          >
            <Trash2 size={14} /> Delete product
          </button>
        </div>
      )}
        </>
      )}
    </SortableItem>
  )
}

export default function ProductsPanel() {
  const products = useSiteStore((s) => s.site.products)
  const addProduct = useSiteStore((s) => s.addProduct)
  const moveProduct = useSiteStore((s) => s.moveProduct)
  const [openId, setOpenId] = useState(null)

  return (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={() => setOpenId(addProduct())}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        <Plus size={16} /> Add product
      </button>
      {products.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No products yet.</p>
      ) : (
        <SortableList ids={products.map((p) => p.id)} onMove={moveProduct} className="space-y-2">
          {products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              open={openId === p.id}
              onToggle={() => setOpenId(openId === p.id ? null : p.id)}
            />
          ))}
        </SortableList>
      )}
    </div>
  )
}
