'use client';

import { useState } from 'react';
import { addPointsToVoucher } from './actions';

interface Props {
  voucher: {
    id: string;
    voucher_number: string;
    current_balance: number;
    customer_name: string | null;
  };
  onClose: () => void;
}

export default function AddPointsModal({ voucher, onClose }: Props) {
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedPoints = parseFloat(points.replace(',', '.')) || 0;
  const isValid = parsedPoints > 0 && reason.trim().length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await addPointsToVoucher(
      voucher.voucher_number,
      parsedPoints,
      reason.trim()
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(
      `${parsedPoints.toFixed(0)} punten toegevoegd. Nieuw saldo: ${result.data.new_balance.toFixed(0)} punten.`
    );
    setLoading(false);
    setPoints('');
    setReason('');

    setTimeout(() => {
      onClose();
    }, 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">
          Punten toevoegen
        </h3>

        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
          <p>
            <span className="text-slate-500">Voucher:</span>{' '}
            <span className="font-mono">{voucher.voucher_number}</span>
          </p>
          <p>
            <span className="text-slate-500">Klant:</span>{' '}
            <span className="font-medium">{voucher.customer_name ?? '—'}</span>
          </p>
          <p>
            <span className="text-slate-500">Huidig saldo:</span>{' '}
            <span className="font-medium">{voucher.current_balance.toFixed(0)} punten</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Aantal punten
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              placeholder="bijv. 50"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reden (verplicht voor audit)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="bijv. Correctie na klantklacht"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              {success}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Annuleer
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}