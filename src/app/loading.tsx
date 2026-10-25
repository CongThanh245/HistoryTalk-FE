import { Mascot } from "@/components/mascot/Mascot";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col justify-center items-center gap-3 bg-[var(--bg-main)]">
      <Mascot mood="thinking" size={72} arms={false} label="Đang tải" />
      <p className="text-sm text-content-muted">Đang lật lại trang sử...</p>
    </div>
  );
}
