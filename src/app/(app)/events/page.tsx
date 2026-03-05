import { EventsClient } from "@/components/event/event-page";
import { Landmark } from "lucide-react";

export default function EventsPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className=" space-y-8 pb-16">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,162,77,0.15) 0%, rgba(163,81,57,0.10) 100%)",
              border: "1px solid rgba(201,162,77,0.25)",
            }}
          >
            <Landmark
              className="w-5 h-5"
              style={{ color: "var(--accent-gold)" }}
            />
          </div>
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

        {/* Client boundary — chỉ phần cần state */}
        <EventsClient />
      </div>
    </div>
  );
}
