"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Landmark, MapPinned } from "lucide-react";
import { MockDataNotice } from "@/components/saas/mock-data-notice";
import { useHydrated } from "@/components/saas/saas-ui";
import {
  LocalCharacterCard,
  LocalContextCard,
  useLocalCatalog,
  type LocalCatalogEntry,
} from "@/components/saas/local-catalog-items";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import type { LocalCharacter, LocalContext } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

type CatalogKind = "CONTEXT" | "CHARACTER";

const SOURCE_PARAM = "nguon";
const LOCAL_VALUE = "dia-phuong";

const COPY: Record<CatalogKind, { noun: string; empty: string }> = {
  CONTEXT: { noun: "bối cảnh", empty: "Lớp của bạn chưa có bối cảnh lịch sử địa phương nào." },
  CHARACTER: { noun: "nhân vật", empty: "Lớp của bạn chưa có nhân vật lịch sử địa phương nào." },
};

/**
 * Source switch "Nội dung chung · Lịch sử địa phương" for the global catalogs (/events, /characters).
 * Customers, staff and accounts without a class get `children` untouched (no extra markup);
 * class members (Teacher, School Student) get the switch, and the global view stays the default.
 */
export function LocalCatalogSwitch({ kind, children }: { kind: CatalogKind; children: ReactNode }) {
  const role = useRole();
  const hydrated = useHydrated();
  const isSchoolMember = hydrated && (role === "TEACHER" || role === "SCHOOL_STUDENT");
  if (!isSchoolMember) return <>{children}</>;
  return (
    <MemberCatalog kind={kind} role={role}>
      {children}
    </MemberCatalog>
  );
}

function MemberCatalog({ kind, role, children }: { kind: CatalogKind; role: string; children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { entries, isMember } = useLocalCatalog(kind, role);
  if (!isMember) return <>{children}</>;

  const isLocal = searchParams.get(SOURCE_PARAM) === LOCAL_VALUE;
  const hrefFor = (local: boolean) => {
    // Global filters (era, page, search, event) do not apply to the local list, so switching resets them.
    const params = new URLSearchParams();
    if (local) params.set(SOURCE_PARAM, LOCAL_VALUE);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <>
      <nav aria-label="Nguồn nội dung" className="flex flex-wrap items-center gap-1.5">
        <SourceLink href={hrefFor(false)} active={!isLocal} icon={<Landmark className="h-3.5 w-3.5" aria-hidden="true" />}>
          Nội dung chung
        </SourceLink>
        <SourceLink
          href={hrefFor(true)}
          active={isLocal}
          local
          icon={<MapPinned className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          Lịch sử địa phương
          <span className="tabular-nums opacity-75">{entries.length}</span>
        </SourceLink>
      </nav>
      {isLocal ? <LocalPanel kind={kind} role={role} entries={entries} /> : children}
    </>
  );
}

function SourceLink({
  href,
  active,
  local,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  local?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[2px] border px-3 text-xs font-bold motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]",
        active
          ? local
            ? "border-[var(--men-lam)] bg-[var(--men-lam)] text-white"
            : "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
          : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

function LocalPanel({
  kind,
  role,
  entries,
}: {
  kind: CatalogKind;
  role: string;
  entries: LocalCatalogEntry<LocalContext | LocalCharacter>[];
}) {
  const isTeacher = role === "TEACHER";
  const copy = COPY[kind];

  return (
    <section aria-label="Lịch sử địa phương" className="space-y-4">
      <MockDataNotice />
      <p className="max-w-3xl text-sm leading-relaxed text-content-muted">
        Tư liệu do thầy cô của trường biên soạn, chỉ hiển thị cho lớp được chia sẻ. Đây là nội dung riêng của lớp, tách biệt với
        kho {copy.noun} chung của HistoryTalk.
        {isTeacher && " Bạn thấy cả tư liệu chưa xuất bản của mình, kèm trạng thái."}
      </p>

      {entries.length === 0 ? (
        <div className="space-y-2 border-y border-[var(--border-strong)] py-14 text-center">
          <p className="archive-title is-plain text-xl">{copy.empty}</p>
          <p className="mx-auto max-w-xl text-xs leading-relaxed text-content-muted">
            Thầy cô soạn tư liệu lịch sử địa phương và gửi Quản trị trường duyệt. Sau khi được duyệt và xuất bản, tư liệu sẽ xuất hiện ở
            đây cho cả lớp.
          </p>
          {isTeacher && (
            <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-line mt-3 inline-flex">
              Soạn {copy.noun} địa phương
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 border-l border-t border-[var(--text-primary)] sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.item.id} className="border-b border-r border-[var(--text-primary)]">
              {entry.item.kind === "CONTEXT" ? (
                <LocalContextCard entry={entry as LocalCatalogEntry<LocalContext>} showStatus={isTeacher} />
              ) : (
                <LocalCharacterCard entry={entry as LocalCatalogEntry<LocalCharacter>} showStatus={isTeacher} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
