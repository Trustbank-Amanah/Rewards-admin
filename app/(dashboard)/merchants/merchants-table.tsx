'use client';

import { useState } from 'react';
import DebitModal from './debit-modal';

interface Merchant {
  id: string;
  business_name: string;
  status: string;
  email: string | null;
  full_name: string | null;
  balance: number;
}

export default function MerchantsTable({ merchants }: { merchants: Merchant[] }) {
  const [selected, setSelected] = useState<Merchant | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Merchant</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium text-right">Saldo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {merchants.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Geen merchants gevonden.
                </td>
              </tr>
            ) : (
              merchants.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{m.business_name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.email ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {m.balance.toFixed(0)} punten
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        m.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelected(m)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Saldo afschrijven
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <DebitModal
          merchant={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}