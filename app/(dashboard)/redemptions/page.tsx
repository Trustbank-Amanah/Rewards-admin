import { createClient } from '@/lib/supabase/server';
import RequestsTable from './requests-table';

export default async function RedemptionsPage() {
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from('redemption_requests')
    .select(
      `
      id,
      amount,
      currency,
      status,
      submitted_at,
      reviewed_at,
      bank_reference,
      rejection_reason,
      merchant_id,
      merchants (
        business_name
      )
    `
    )
    .order('submitted_at', { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Uitbetalingen</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          Fout bij laden: {error.message}
        </div>
      </div>
    );
  }

  const rows =
    requests?.map((r: any) => ({
      id: r.id,
      merchant_name: r.merchants?.business_name ?? 'Onbekend',
      amount: Number(r.amount),
      currency: r.currency,
      status: r.status,
      submitted_at: r.submitted_at,
      reviewed_at: r.reviewed_at,
      bank_reference: r.bank_reference,
      rejection_reason: r.rejection_reason,
    })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Uitbetalingen</h1>
      <RequestsTable requests={rows} />
    </div>
  );
}