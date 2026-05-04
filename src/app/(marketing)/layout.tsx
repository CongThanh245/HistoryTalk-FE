import { Footer } from "@/components/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";


export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] relative">
      {/* Background pattern */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, var(--accent-gold) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, var(--accent-blue) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Navigation */}
      <MarketingNavbar />
      
      {/* Main Content */}

      <main className="w-full">
        {children}
      </main>
      <Footer></Footer>
    </div>
  );
}