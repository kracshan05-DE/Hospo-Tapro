'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { createProduct, updateProduct } from '@/app/actions/products';
import type { Product } from '@/lib/types';

const MAX_FILE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export default function ProductForm({
  product,
  nextSortOrder,
  onSaved,
  onCancel,
}: {
  product: Product | null;
  nextSortOrder: number;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEditing = !!product;
  const [name, setName] = useState(product?.name ?? '');
  const [volume, setVolume] = useState(product?.volume ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '');
  const [preview, setPreview] = useState(product?.image_url ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Please choose a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_FILE_MB}MB.`);
      return;
    }
    setError('');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    let finalImageUrl = imageUrl;

    if (file) {
      setUploading(true);
      const supabase = createClient();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      setUploading(false);

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(path);
      finalImageUrl = publicUrlData.publicUrl;
    }

    setSaving(true);
    const input = {
      name: name.trim(),
      volume: volume.trim(),
      description: description.trim(),
      image_url: finalImageUrl,
      sort_order: product?.sort_order ?? nextSortOrder,
    };

    const result = isEditing ? await updateProduct(product!.id, input) : await createProduct(input);
    setSaving(false);

    if (result.ok) {
      onSaved();
    } else {
      setError(result.error);
    }
  }

  const busy = uploading || saving;

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Product' : 'Add Product'}</h2>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="pname">Product Name</label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Red Kochchi Sauce" required maxLength={200} />
        </div>
        <div className="form-field">
          <label htmlFor="pvol">Size / Volume</label>
          <input id="pvol" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 250ml Bottle" maxLength={80} />
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: 16 }}>
        <label htmlFor="pdesc">Description</label>
        <textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short, evocative line about this product." maxLength={2000} />
      </div>

      <div className="form-field" style={{ marginBottom: 8 }}>
        <label htmlFor="pimg">Product Photo</label>
        <input id="pimg" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleFileChange} />
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Preview" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 4, marginTop: 8, marginBottom: 8 }} />
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="form-actions" style={{ marginBottom: 0 }}>
        <button type="submit" className="btn-primary" disabled={busy}>
          {uploading ? 'Uploading photo…' : saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Product'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
