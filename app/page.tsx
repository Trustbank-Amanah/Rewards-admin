import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';


export const instant = false;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'bank_admin') {
    await supabase.auth.signOut();
    redirect('/login?error=not_admin');
  }

  redirect('/dashboard');
}