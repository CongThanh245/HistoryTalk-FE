import { Footer } from "@/components/footer";
import { MarketingBreadcrumbs } from "@/components/seo/marketing-breadcrumbs";
import { MarketingNavbar } from "@/components/marketing/navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-[0.05] bg-[url('/copper_drum_pattern.webp')] bg-no-repeat bg-[length:900px] bg-[position:85%_110%]" />

      {/* Navigation */}
      <MarketingNavbar />

      {/* Main Content */}

      <main className="w-full">
        <MarketingBreadcrumbs />
        {children}
      </main>
      <Footer></Footer>
    </div>
  );
}
