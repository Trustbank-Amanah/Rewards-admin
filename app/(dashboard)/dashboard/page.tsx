import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();

  const [vouchersRes, transactionsRes, requestsRes, ledgerRes] = await Promise.all([
    supabase.from('vouchers').select('current_balance, status'),
    supabase
      .from('transactions')
      .select('id, amount, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('redemption_requests').select('id, status, amount'),
    supabase.from('merchant_ledger').select('amount, entry_type'),
  ]);

  const activeVouchers = vouchersRes.data?.filter((v) => v.status === 'active') ?? [];
  const totalPoints = activeVouchers.reduce((sum, v) => sum + Number(v.current_balance), 0);
  const pendingRequests = requestsRes.data?.filter((r) => r.status === 'pending' || r.status === 'review') ?? [];
  const merchantBalance = (ledgerRes.data ?? []).reduce((sum, l) => {
    return sum + (l.entry_type === 'credit' ? Number(l.amount) : -Number(l.amount));
  }, 0);
  const recentTransactions = transactionsRes.data ?? [];

  const stats = [
    { label: 'Actieve vouchers', value: activeVouchers.length.toString(), sub: 'in omloop' },
    { label: 'Totaal punten', value: totalPoints.toFixed(0), sub: 'bij klanten' },
    { label: 'Merchant saldo', value: `SRD ${merchantBalance.toFixed(2)}`, sub: 'uit te betalen' },
    { label: 'Openstaand', value: pendingRequests.length.toString(), sub: 'uitbetaalverzoeken' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Overzicht</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Transacties laatste 7 dagen</h2>
        </div>
        <div className="p-6">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-500">Nog geen transacties.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-2">Datum</th>
                  <th className="pb-2">Bedrag</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">{new Date(t.created_at).toLocaleString('nl-NL')}</td>
                    <td className="py-2 font-medium">SRD {Number(t.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}