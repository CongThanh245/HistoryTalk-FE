import { CharactersClient } from "@/components/character/character-client";
import { Users } from "lucide-react";

export default function CharactersPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(201,162,77,0.15) 0%, rgba(163,81,57,0.10) 100%)",
              border: "1px solid rgba(201,162,77,0.25)",
            }}
          >
            <Users className="w-5 h-5" style={{ color: "var(--gold-on-light)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--content-heading)" }}>
              Nhân vật lịch sử
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--content-muted)" }}>
              Trò chuyện với những nhân vật đã làm nên lịch sử Việt Nam
            </p>
          </div>
        </div>

        {/* Client — filter + grid + pagination */}
        <CharactersClient />

      </div>
    </div>
  );
}