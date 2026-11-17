'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createVoucher(formData: FormData) {
  const supabase = await createClient();

  // Controleer of de gebruiker bank_admin is
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

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const fullName = (formData.get('full_name') as string)?.trim();
  const initialAmount = parseFloat(formData.get('initial_amount') as string);
  const expiryMonths = parseInt(formData.get('expiry_months') as string, 10) || 12;

  if (!email || !fullName || isNaN(initialAmount) || initialAmount <= 0) {
    return { error: 'Vul alle velden correct in' };
  }

  // Zoek de customer op basis van e-mail
  const { data: customerProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .eq('role', 'customer')
    .maybeSingle();

  if (!customerProfile) {
    return {
      error: `Geen customer gevonden met e-mail ${email}. Maak eerst een customer-account aan via Supabase Dashboard → Authentication.`,
    };
  }

  // Berekening verloopdatum
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

  // Maak voucher aan
  const { data: voucher, error: insertError } = await supabase
    .from('vouchers')
    .insert({
      customer_id: customerProfile.id,
      initial_amount: initialAmount,
      current_balance: initialAmount,
      currency: 'SRD',
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: 'bank_admin',
    action: 'voucher_created',
    entity_type: 'voucher',
    entity_id: voucher.id,
    metadata: {
      initial_amount: initialAmount,
      customer_email: email,
      expires_at: expiresAt.toISOString(),
    },
  });

  revalidatePath('/vouchers');
  return { success: true, voucherNumber: voucher.voucher_number };
}

export async function deactivateVoucher(voucherId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  const { error } = await supabase
    .from('vouchers')
    .update({ status: 'disabled' })
    .eq('id', voucherId);

  if (error) return { error: error.message };

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: 'bank_admin',
    action: 'voucher_disabled',
    entity_type: 'voucher',
    entity_id: voucherId,
  });

  revalidatePath('/vouchers');
  return { success: true };
}