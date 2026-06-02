"use client";

import { useRoom } from "@/features/room/hooks";
import {
  RoomView,
  RoomViewLoading,
  RoomViewEmpty,
} from "@/components/room-view/RoomView";
import { useRouter } from "next/navigation";

interface RoomPageClientProps {
  roomId: string;
}

export default function RoomPageClient({ roomId }: RoomPageClientProps) {
  const router = useRouter();
  const { data: room, isLoading } = useRoom(roomId);

  if (isLoading) return <RoomViewLoading />;
  if (!room) return <RoomViewEmpty onBack={() => router.push("/map")} />;

  return <RoomView room={room} onBack={() => router.push("/map")} />;
}
