import Link from "next/link";
import { Container } from "@/components/marketing/container";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/** Shared layout of the legal pages (/terms, /privacy). */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: string; sections: LegalSection[] }) {
  return (
    <Container className="py-12 md:py-16">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-gold)]">HistoryTalk</p>
        <h1 className="archive-title mt-2 text-3xl md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[var(--text-tertiary)]">Cập nhật lần cuối: {updated}</p>
        <p className="mt-6 leading-7 text-[var(--text-secondary)]">{intro}</p>

        <ol className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <li key={section.heading}>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {index + 1}. {section.heading}
              </h2>
              {section.paragraphs.map((text) => (
                <p key={text} className="mt-3 leading-7 text-[var(--text-secondary)]">
                  {text}
                </p>
              ))}
            </li>
          ))}
        </ol>

        <p className="mt-12 border-t border-[var(--border-default)] pt-6 text-sm text-[var(--text-tertiary)]">
          Xem thêm{" "}
          <Link href="/terms" className="text-gold-on-light hover:underline">
            Điều khoản dịch vụ
          </Link>{" "}
          và{" "}
          <Link href="/privacy" className="text-gold-on-light hover:underline">
            Chính sách quyền riêng tư
          </Link>
          .
        </p>
      </article>
    </Container>
  );
}
