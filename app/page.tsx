import { redirect } from 'next/navigation';
import { getSettings } from '@/lib/settingsDb';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  if (invite) redirect(`/i/${encodeURIComponent(invite)}`); // anciens liens ?invite=… 
  return <AppShell initialSettings={await getSettings()} />;
}
