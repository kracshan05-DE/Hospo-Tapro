'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { deleteProduct } from '@/app/actions/products';
import ProductForm from './ProductForm';

export default function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => setProducts(initialProducts), [initialProducts]);

  async function handleDelete(product: Product) {
    if (!confirm(`Remove "${product.name}" from the collection? This cannot be undone.`)) return;
    setDeletingId(product.id);
    const result = await deleteProduct(product.id);
    setDeletingId(null);
    if (result.ok) {
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  function handleSaved() {
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      {editing ? (
        <ProductForm
          product={editing === 'new' ? null : editing}
          nextSortOrder={products.length + 1}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="form-actions">
          <button className="btn-primary" onClick={() => setEditing('new')}>
            + Add Product
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-admin">No products yet. Add your first one above.</div>
      ) : (
        <div className="admin-product-list">
          {products.map((p) => (
            <div className="admin-product-row" key={p.id}>
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt={p.name} className="admin-thumb" />
              ) : (
                <div className="admin-thumb-empty">No photo</div>
              )}
              <div className="admin-row-info">
                <h3>{p.name}</h3>
                <span className="vol">{p.volume}</span>
              </div>
              <div className="admin-row-actions">
                <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                  ✎
                </button>
                <button className="icon-btn" aria-label={`Delete ${p.name}`} onClick={() => handleDelete(p)} disabled={deletingId === p.id}>
                  {deletingId === p.id ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
