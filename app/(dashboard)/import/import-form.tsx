'use client';

import { useState } from 'react';
import { importPoints } from './actions';

export default function ImportForm() {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText.trim()) return;

    setLoading(true);
    setResult(null);

    const res = await importPoints(csvText);
    setResult(res);
    setLoading(false);
  }

  const sampleCsv = `voucher_number,points,reference
V-ABC12345,50,DAILY-2026-11-15-001
V-DEF67890,25,DAILY-2026-11-15-002`;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-medium mb-1">Hoe werkt dit?</p>
        <p>
          Upload een CSV met kolommen <code className="bg-blue-100 px-1 rounded">voucher_number</code>,{' '}
          <code className="bg-blue-100 px-1 rounded">points</code>, en{' '}
          <code className="bg-blue-100 px-1 rounded">reference</code>. Elke rij voegt punten toe aan de
          voucher. Dit simuleert de dagelijkse batch-import om 15:00.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            CSV-bestand uploaden
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Of plak CSV hier
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
            placeholder={sampleCsv}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !csvText.trim()}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
        >
          {loading ? 'Importeren...' : 'Import uitvoeren'}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <p className="font-medium">Fout: {result.error}</p>
              {result.details && (
                <ul className="mt-2 list-disc list-inside">
                  {result.details.map((d: string, i: number) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                <p className="font-medium mb-2">Import voltooid</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-green-700">Totaal</p>
                    <p className="text-lg font-bold">{result.summary.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Gelukt</p>
                    <p className="text-lg font-bold">{result.summary.success}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Mislukt</p>
                    <p className="text-lg font-bold">{result.summary.failed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Punten toegevoegd</p>
                    <p className="text-lg font-bold">{result.summary.totalPoints}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Voucher</th>
                      <th className="px-4 py-3 font-medium">Resultaat</th>
                      <th className="px-4 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r: any, i: number) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-4 py-2 font-mono text-xs">{r.voucher}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              r.success
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.success ? 'Gelukt' : 'Mislukt'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}