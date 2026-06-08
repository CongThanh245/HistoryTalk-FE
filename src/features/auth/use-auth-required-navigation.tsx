"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogInIcon, MessageCircleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth.store";
import { syncAuthCookies } from "./auth-cookies";

interface UseAuthRequiredNavigationOptions {
  title?: string;
  description?: string;
}

export function useAuthRequiredNavigation({
  title = "Bạn cần đăng nhập để chat",
  description = "Đăng nhập để bắt đầu trò chuyện với các nhân vật lịch sử và lưu lại lịch sử hội thoại của bạn.",
}: UseAuthRequiredNavigationOptions = {}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const [open, setOpen] = useState(false);

  const navigateWithAuth = useCallback(
    (href: string) => {
      if (isAuthenticated) {
        syncAuthCookies(user, tokens);
        router.push(href);
        return;
      }

      setOpen(true);
    },
    [isAuthenticated, router, tokens, user],
  );

  const runWithAuth = useCallback(
    (action: () => void) => {
      if (isAuthenticated) {
        syncAuthCookies(user, tokens);
        action();
        return;
      }

      setOpen(true);
    },
    [isAuthenticated, tokens, user],
  );

  const authRequiredDialog = useMemo(
    () => (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="sm:max-w-[420px]"
          style={{
            background: "var(--card-light-bg)",
            borderColor: "var(--card-light-border)",
            color: "var(--content-heading)",
          }}
        >
          <DialogHeader className="items-center text-center sm:items-start sm:text-left">
            <div
              className="mb-1 flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                background: "rgba(201,162,77,0.14)",
                color: "var(--gold-on-light)",
              }}
            >
              <MessageCircleIcon className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              {description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[var(--card-light-border)]"
            >
              Để sau
            </Button>
            <Button type="button" onClick={() => router.push("/login")}>
              <LogInIcon className="h-4 w-4" />
              Đăng nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    [description, open, router, title],
  );

  return { authRequiredDialog, isAuthenticated, navigateWithAuth, runWithAuth };
}
