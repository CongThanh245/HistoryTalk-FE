export const runtime = 'nodejs';

import PageContent from "./page-content";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  return <PageContent params={params} />;
}
