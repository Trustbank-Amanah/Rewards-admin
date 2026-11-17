'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

interface ImportRow {
  voucher_number: string;
  points: number;
  reference: string;
}

export async function importPoints(csvText: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Niet ingelogd' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'bank_admin') {
    return { error: 'Geen admin-rechten' };
  }

  // Parse CSV (simpele parser, verwacht: voucher_number,points,reference)
  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (lines.length === 0) {
    return { error: 'CSV is leeg' };
  }

  // Sla header over als die bestaat
  const firstLine = lines[0].toLowerCase();
  const dataLines = firstLine.includes('voucher') ? lines.slice(1) : lines;

  const rows: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const parts = dataLines[i].split(',').map((p) => p.trim());
    if (parts.length < 2) {
      errors.push(`Regel ${i + 2}: te weinig kolommen`);
      continue;
    }

    const [voucherNumber, pointsStr, ...rest] = parts;
    const points = parseFloat(pointsStr);
    const reference = rest.join(',') || `IMPORT-${Date.now()}`;

    if (!voucherNumber || isNaN(points) || points <= 0) {
      errors.push(`Regel ${i + 2}: ongeldige data`);
      continue;
    }

    rows.push({ voucher_number: voucherNumber, points, reference });
  }

  if (rows.length === 0) {
    return { error: 'Geen geldige rijen gevonden', details: errors };
  }

  // Verwerk elke rij via RPC
  const results: { voucher: string; success: boolean; message: string }[] = [];
  let successCount = 0;
  let totalPoints = 0;

  for (const row of rows) {
    const { data, error } = await supabase.rpc('import_points', {
      p_voucher_number: row.voucher_number,
      p_points: row.points,
      p_reference: row.reference,
    });

    if (error) {
      results.push({ voucher: row.voucher_number, success: false, message: error.message });
    } else {
      successCount++;
      totalPoints += row.points;
      results.push({ voucher: row.voucher_number, success: true, message: 'OK' });
    }
  }

  // Log de import in audit_logs
  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    actor_role: 'bank_admin',
    action: 'points_imported_batch',
    entity_type: 'import',
    metadata: {
      total_rows: rows.length,
      success_count: successCount,
      total_points: totalPoints,
    },
  });

  revalidatePath('/import');
  revalidatePath('/vouchers');
  revalidatePath('/dashboard');

  return {
    success: true,
    summary: {
      total: rows.length,
      success: successCount,
      failed: rows.length - successCount,
      totalPoints,
    },
    results,
    parseErrors: errors,
  };
}