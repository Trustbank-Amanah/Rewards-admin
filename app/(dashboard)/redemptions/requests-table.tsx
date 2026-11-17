'use client';

import { useState, useTransition } from 'react';
import { approveRequest, rejectRequest } from './actions';

interface RequestRow {
  id: string;
  merchant_name: string;
  amount: number;
  currency: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  bank_reference: string | null;
  rejection_reason: string | null;
}

export default function RequestsTable({ requests }: { requests: RequestRow[] }) {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [modal, setModal] = useState<{
    type: 'approve' | 'reject';
    request: RequestRow;
  } | null>(null);

  const filtered = requests.filter((r) => {
    if (filter === 'pending') return r.status === 'pending' || r.status === 'review';
    return true;
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'pending'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Openstaand
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Alle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Merchant</th>
                <th className="px-4 py-3 font-medium text-right">Bedrag</th>
                <th className="px-4 py-3 font-medium">Ingediend</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Geen uitbetaalverzoeken.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{r.merchant_name}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      SRD {r.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.submitted_at).toLocaleString('nl-NL')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(r.status === 'pending' || r.status === 'review') && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setModal({ type: 'approve', request: r })}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Goedkeuren
                          </button>
                          <button
                            onClick={() => setModal({ type: 'reject', request: r })}
                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >
                            Afwijzen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <ActionModal modal={modal} onClose={() => setModal(null)} />}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    review: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        styles[status] ?? 'bg-slate-100 text-slate-800'
      }`}
    >
      {status}
    </span>
  );
}

function ActionModal({
  modal,
  onClose,
}: {
  modal: { type: 'approve' | 'reject'; request: RequestRow };
  onClose: () => void;
}) {
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const res =
      modal.type === 'approve'
        ? await approveRequest(modal.request.id, reference)
        : await rejectRequest(modal.request.id, reason);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {modal.type === 'approve' ? 'Uitbetaling goedkeuren' : 'Uitbetaling afwijzen'}
        </h3>

        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
          <p>
            <span className="text-slate-500">Merchant:</span>{' '}
            <span className="font-medium">{modal.request.merchant_name}</span>
          </p>
          <p>
            <span className="text-slate-500">Bedrag:</span>{' '}
            <span className="font-medium">SRD {modal.request.amount.toFixed(2)}</span>
          </p>
        </div>

        {modal.type === 'approve' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bank referentie
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="BANK-2026-11-15-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">
              Optioneel. Wordt opgeslagen als bewijs van de transactie.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reden van afwijzing
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
              placeholder="Bijv. onvoldoende verificatie..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            Annuleer
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              loading ||
              (modal.type === 'reject' && !reason.trim())
            }
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 ${
              modal.type === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Bezig...' : modal.type === 'approve' ? 'Goedkeuren' : 'Afwijzen'}
          </button>
        </div>
      </div>
    </div>
  );
}