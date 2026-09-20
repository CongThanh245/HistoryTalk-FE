export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="map-page h-full min-h-0 w-full overflow-hidden">{children}</div>;
}
