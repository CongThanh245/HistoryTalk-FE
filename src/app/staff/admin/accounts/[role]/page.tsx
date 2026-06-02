export const runtime = 'edge';

import PageContent from "./page-content";

export default function AccountsPage({ params }: { params: Promise<{ role: string }> }) {
  return <PageContent />;
}
