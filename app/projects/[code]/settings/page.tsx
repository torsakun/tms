import { redirect } from "next/navigation";

export default async function SettingsRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/projects/${code}/settings/access-control`);
}
