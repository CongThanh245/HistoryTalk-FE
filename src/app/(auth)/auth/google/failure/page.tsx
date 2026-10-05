"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const GOOGLE_OAUTH_START_URL =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_START_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${(
    process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1"
  ).replace(/\/api\/v1\/?$/, "")}/oauth2/authorization/google`;

export default function GoogleOAuthFailurePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 bg-[var(--bg-main)] text-content-text">
      <div className="w-full max-w-md rounded-[2px] border border-[var(--text-primary)] border-t-[3px] border-t-[var(--accent-gold)] p-6 sm:p-8 text-center bg-[var(--bg-surface)]">
        <h1 className="archive-title mt-2 text-[28px]">
          Google sign in failed
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Please try again or sign in with email and password.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1 rounded-[2px] shadow-none bg-[var(--accent-gold)] text-[#FFFFFF] hover:bg-[var(--accent-bronze)]"
            onClick={() => {
              window.location.href = GOOGLE_OAUTH_START_URL;
            }}
          >
            Retry Google
          </Button>
          <Button asChild type="button" variant="outline" className="flex-1 rounded-[2px] shadow-none border-[var(--text-primary)] bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
