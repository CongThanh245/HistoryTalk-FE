export const runtime = 'edge';

"use client";

import { use } from "react";
import { useRoom } from "@/features/room/hooks";
import {
  RoomView,
  RoomViewLoading,
  RoomViewEmpty,
} from "@/components/room-view/RoomView";
import { useRouter } from "next/navigation";

interface RoomPageProps {
  params: Promise<{ roomId: string }>; // ← Promise
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params); // ← unwrap bằng React.use()
  const router = useRouter();
  const { data: room, isLoading } = useRoom(roomId);

  if (isLoading) return <RoomViewLoading />;
  if (!room) return <RoomViewEmpty onBack={() => router.push("/map")} />;

  return <RoomView room={room} onBack={() => router.push("/map")} />;
}
/*
 * ═══════════════════════════════════════════════════════════
 * HƯỚNG DẪN TÍCH HỢP VÀO MAP
 * ═══════════════════════════════════════════════════════════
 *
 * 1. Trong LandmarkPanel.tsx, thêm nút "Bước vào không gian":
 *
 *    import { useRouter } from "next/navigation";
 *    import { MOCK_ROOMS } from "@/services/room.service";
 *
 *    const router = useRouter();
 *    const room = MOCK_ROOMS.find(r => r.landmarkId === landmark.landmarkId);
 *
 *    {room && (
 *      <button onClick={() => router.push(`/map/room/${room.roomId}`)}>
 *        <DoorOpen size={16} />
 *        Bước vào không gian
 *      </button>
 *    )}
 *
 * 2. Tạo file: app/(app)/map/room/[roomId]/page.tsx  ← file này
 *
 * 3. Layout map/room dùng chung layout (app) nhưng KHÔNG có header/sidebar
 *    nếu muốn fullscreen thật sự — tạo layout riêng:
 *    app/(app)/map/room/layout.tsx:
 *
 *    export default function RoomLayout({ children }) {
 *      return <div className="w-screen h-screen overflow-hidden">{children}</div>;
 *    }
 *
 * 4. QUERY KEY — thêm vào shared/query-key.ts:
 *    rooms: {
 *      detail: (id: string) => ["rooms", "detail", id] as const,
 *      byLandmark: (id: string) => ["rooms", "by-landmark", id] as const,
 *    },
 *
 * 5. KHI NỐI CHAT:
 *    Trong RoomView.tsx, thay comment TODO bằng component chat thật:
 *    - Truyền characterId + contextId + roomContext
 *    - roomContext inject vào system prompt để AI biết bối cảnh
 * ═══════════════════════════════════════════════════════════
 */
