'use server';

import { createClient } from '@/lib/supabase-server';
import { logServerError } from '@/lib/log';
import { logAdminAction } from '@/lib/audit';
import { revalidatePath } from 'next/cache';
import type { ProductInput } from '@/lib/types';

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_NAME = 200;
const MAX_VOLUME = 80;
const MAX_DESCRIPTION = 2000;

function validate(input: ProductInput): string | null {
  if (!input.name.trim()) return 'Product name is required.';
  if (input.name.length > MAX_NAME) return `Product name must be under ${MAX_NAME} characters.`;
  if (input.volume.length > MAX_VOLUME) return `Volume must be under ${MAX_VOLUME} characters.`;
  if (input.description.length > MAX_DESCRIPTION) {
    return `Description must be under ${MAX_DESCRIPTION} characters.`;
  }
  // Only ever accept image URLs we generated ourselves (our Supabase Storage
  // bucket), never an arbitrary attacker-supplied URL — this action is the
  // only place `image_url` gets persisted, so this check is the real gate.
  if (input.image_url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\//i.test(input.image_url)) {
    return 'Invalid image reference.';
  }
  return null;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  const fieldError = validate(input);
  if (fieldError) return { ok: false, error: fieldError };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'You must be logged in.' };

  const { data, error } = await supabase.from('products').insert(input).select('id').single();
  if (error) {
    logServerError('products.create', error);
    return { ok: false, error: 'Could not save the product. Please try again.' };
  }

  await logAdminAction(user.email ?? user.id, 'product.create', data?.id, { name: input.name });

  revalidatePath('/tapro');
  revalidatePath('/admin/dashboard/tapro');
  return { ok: true };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const fieldError = validate(input);
  if (fieldError) return { ok: false, error: fieldError };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'You must be logged in.' };

  const { error } = await supabase.from('products').update(input).eq('id', id);
  if (error) {
    logServerError('products.update', error);
    return { ok: false, error: 'Could not save changes. Please try again.' };
  }

  await logAdminAction(user.email ?? user.id, 'product.update', id, { name: input.name });

  revalidatePath('/tapro');
  revalidatePath('/admin/dashboard/tapro');
  return { ok: true };
}

export async function deleteProduct(id: string, imagePath?: string | null): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'You must be logged in.' };

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    logServerError('products.delete', error);
    return { ok: false, error: 'Could not delete the product. Please try again.' };
  }

  if (imagePath) {
    const { error: storageError } = await supabase.storage.from('product-images').remove([imagePath]);
    if (storageError) logServerError('products.delete.storage', storageError);
  }

  await logAdminAction(user.email ?? user.id, 'product.delete', id);

  revalidatePath('/tapro');
  revalidatePath('/admin/dashboard/tapro');
  return { ok: true };
}
