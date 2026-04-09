import { redirect } from 'next/navigation';

export default async function DashboardRoot({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params;
  
  // Automatically route users into the operational capture pipeline
  redirect(`/${orgSlug}/pipeline`);
}
