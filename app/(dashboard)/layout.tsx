import { connection } from 'next/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LogoutButton from './logout-button';

export const instant = false;

const navItems = [
  { href: '/dashboard', label: 'Overzicht', icon: '📊' },
  { href: '/vouchers', label: 'Vouchers', icon: '🎫' },
  { href: '/merchants', label: 'Merchants', icon: '🏪' },
  { href: '/import', label: 'Punten importeren', icon: '📥' },
  { href: '/redemptions', label: 'Uitbetalingen', icon: '💰' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'bank_admin') {
    redirect('/login?error=not_admin');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-lg font-bold">Trustbank Amanah</h1>
          <p className="text-xs text-slate-400 mt-1">Admin dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Ingelogd als</p>
          <p className="text-sm font-medium truncate">
            {profile?.full_name ?? profile?.email}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}