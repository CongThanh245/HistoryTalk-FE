import { EventsClient } from "@/components/event/event-page";
export default function EventsPage() {
  // ← bỏ async
  return (
    <div className="px-6 py-8">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--content-heading)" }}
            >
              Sự kiện lịch sử
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--content-muted)" }}
            >
              Hành trình qua các mốc lịch sử quan trọng của dân tộc
            </p>
          </div>
        </div>
        <EventsClient /> {/* ← bỏ events prop */}
      </div>
    </div>
  );
}
