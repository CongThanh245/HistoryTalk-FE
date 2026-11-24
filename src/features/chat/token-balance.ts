import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";

/** After a chat reply or call: refresh the profile token balance and the school student's "Token hôm nay" card. */
export function invalidateTokenBalance(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: queryKeys.profile.me });
  qc.invalidateQueries({ queryKey: queryKeys.dashboard.student });
}
