'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function debitMerchant(
  merchantId: string,
  amount: number,
  reason: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'bank_admin') {
    return { error: 'Geen admin-rechten' };
  }

  const { data, error } = await supabase.rpc('admin_debit_merchant', {
    p_merchant_id: merchantId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) return { error: error.message };

  revalidatePath('/merchants');
  revalidatePath('/dashboard');
  return { success: true, data };
}