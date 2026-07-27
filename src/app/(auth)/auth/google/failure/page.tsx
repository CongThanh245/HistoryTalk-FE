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
    <div className="flex min-h-screen items-center justify-center px-6 bg-[var(--palladian)] text-content-text">
      <div className="w-full max-w-md rounded-xl border p-6 text-center shadow-sm bg-card-light-bg border-card-light-border">
        <h1 className="text-xl font-semibold text-content-heading">
          Google sign in failed
        </h1>
        <p className="mt-2 text-sm text-content-muted">
          Please try again or sign in with email and password.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() => {
              window.location.href = GOOGLE_OAUTH_START_URL;
            }}
          >
            Retry Google
          </Button>
          <Button asChild type="button" variant="outline" className="flex-1">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
