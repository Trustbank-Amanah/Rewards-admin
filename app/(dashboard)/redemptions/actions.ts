'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function approveRequest(requestId: string, bankReference: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  const { error } = await supabase.rpc('review_redemption_request', {
    p_request_id: requestId,
    p_decision: 'approved',
    p_bank_reference: bankReference,
    p_rejection_reason: null,
  });

  if (error) return { error: error.message };

  revalidatePath('/redemptions');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  const { error } = await supabase.rpc('review_redemption_request', {
    p_request_id: requestId,
    p_decision: 'rejected',
    p_bank_reference: null,
    p_rejection_reason: reason,
  });

  if (error) return { error: error.message };

  revalidatePath('/redemptions');
  revalidatePath('/dashboard');
  return { success: true };
}