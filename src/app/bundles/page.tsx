import { redirect } from "next/navigation";

// Bundles are now shown inline on /deals — keep this route as a permanent
// redirect for any external links pointing at /bundles.
export default async function BundlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/deals`);
}
