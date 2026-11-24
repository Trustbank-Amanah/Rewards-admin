import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import MerchantsTable from './merchants-table';

export const instant = false;

export default async function MerchantsPage() {
  await connection();

  const supabase = await createClient();

  const { data: merchants, error } = await supabase
    .from('merchants')
    .select(`
      id,
      business_name,
      status,
      created_at,
      profiles!merchants_profile_id_fkey (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Merchants</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          Fout bij laden: {error.message}
        </div>
      </div>
    );
  }

  const merchantIds = (merchants ?? []).map((m) => m.id);
  const { data: ledger } = await supabase
    .from('merchant_ledger')
    .select('merchant_id, amount, entry_type')
    .in('merchant_id', merchantIds);

  const balanceMap: Record<string, number> = {};
  (ledger ?? []).forEach((entry) => {
    const current = balanceMap[entry.merchant_id] ?? 0;
    balanceMap[entry.merchant_id] =
      current + (entry.entry_type === 'credit' ? Number(entry.amount) : -Number(entry.amount));
  });

  const rows = (merchants ?? []).map((m: any) => ({
    id: m.id,
    business_name: m.business_name,
    status: m.status,
    email: m.profiles?.email ?? null,
    full_name: m.profiles?.full_name ?? null,
    balance: balanceMap[m.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Merchants</h1>
      <MerchantsTable merchants={rows} />
    </div>
  );
}