import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message:
        "Voice STT is handled by Web Speech API on the client. This legacy endpoint is disabled.",
    },
    { status: 410 },
  );
}
