import { MarketingNav } from "@/components/layouts/marketing-nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
      console.log('🎯 MarketingLayout is rendering!', { children }); // Debug log

  return (
    <div className="min-h-screen bg-[#0e1a2b] text-[#e7ddc8] relative">
      {/* Background pattern */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(201, 162, 77, 0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(143, 179, 200, 0.03) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Top Navigation - Marketing */}
      <MarketingNav />
      
      {/* Main Content - No Sidebar */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}