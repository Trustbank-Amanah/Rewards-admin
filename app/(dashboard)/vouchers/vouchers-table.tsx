'use client';

import { useState, useTransition } from 'react';
import { deactivateVoucher } from './actions';
import AddPointsModal from './add-points-modal';

interface VoucherRow {
  id: string;
  voucher_number: string;
  current_balance: number;
  currency: string;
  status: string;
  expires_at: string | null;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
}

export default function VouchersTable({ vouchers }: { vouchers: VoucherRow[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [pending, startTransition] = useTransition();
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRow | null>(null);

  const filtered = vouchers.filter((v) => {
    if (filter !== 'all' && v.status !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.voucher_number.toLowerCase().includes(q) ||
      (v.customer_name ?? '').toLowerCase().includes(q) ||
      (v.customer_email ?? '').toLowerCase().includes(q)
    );
  });

  function handleDeactivate(id: string, number: string) {
    if (!confirm(`Weet je zeker dat je voucher ${number} wilt deactiveren?`)) return;
    startTransition(async () => {
      const result = await deactivateVoucher(id);
      if (result.error) alert(result.error);
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zoek op voucher, naam of e-mail..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="all">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="disabled">Gedeactiveerd</option>
            <option value="expired">Verlopen</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Voucher</th>
                <th className="px-4 py-3 font-medium">Klant</th>
                <th className="px-4 py-3 font-medium text-right">Saldo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Verloopt</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Geen vouchers gevonden.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{v.voucher_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{v.customer_name ?? '—'}</div>
                      <div className="text-xs text-slate-500">{v.customer_email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {v.current_balance.toFixed(0)} punten
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {v.expires_at ? new Date(v.expires_at).toLocaleDateString('nl-NL') : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedVoucher(v)}
                        className="text-xs text-blue-600 hover:text-blue-800 mr-3"
                      >
                        + Punten
                      </button>
                      {v.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(v.id, v.voucher_number)}
                          disabled={pending}
                          className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Deactiveren
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          {filtered.length} van {vouchers.length} vouchers
        </div>
      </div>

      {/* Modal — BUITEN de tabel, slechts één keer gerenderd */}
      {selectedVoucher && (
        <AddPointsModal
          voucher={{
            id: selectedVoucher.id,
            voucher_number: selectedVoucher.voucher_number,
            current_balance: selectedVoucher.current_balance,
            customer_name: selectedVoucher.customer_name,
          }}
          onClose={() => setSelectedVoucher(null)}
        />
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    disabled: 'bg-red-100 text-red-800',
    expired: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? 'bg-slate-100 text-slate-800'}`}>
      {status}
    </span>
  );
}