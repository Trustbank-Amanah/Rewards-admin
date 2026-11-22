import { createClient } from '@/lib/supabase/server';
import CreateVoucherForm from './create-voucher-form';
import VouchersTable from './vouchers-table';


export const instant = false;

export default async function VouchersPage() {
  const supabase = await createClient();

  // Haal vouchers op met klant-info via een join
  const { data: vouchers, error } = await supabase
    .from('vouchers')
    .select(
      `
      id,
      voucher_number,
      current_balance,
      currency,
      status,
      expires_at,
      created_at,
      customer_id,
      profiles!vouchers_customer_id_fkey (
        full_name,
        email
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Vouchers</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          Fout bij laden: {error.message}
        </div>
      </div>
    );
  }

  const rows =
    vouchers?.map((v: any) => ({
      id: v.id,
      voucher_number: v.voucher_number,
      current_balance: Number(v.current_balance),
      currency: v.currency,
      status: v.status,
      expires_at: v.expires_at,
      created_at: v.created_at,
      customer_name: v.profiles?.full_name ?? null,
      customer_email: v.profiles?.email ?? null,
    })) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Vouchers</h1>

      <CreateVoucherForm />
      <VouchersTable vouchers={rows} />
    </div>
  );
}