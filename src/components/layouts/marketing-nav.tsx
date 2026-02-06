'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function MarketingNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  console.log('🎯 MarketingNav is rendering!', { pathname }); // Debug log

  const navLinks = [
    { href: '/', label: 'Trang Chủ' },
    { href: '/explore', label: 'Khám Phá' },
    { href: '/pricing', label: 'Nâng Cấp' },
    { href: '/about', label: 'Về Chúng Tôi' },
    { href: '/contact', label: 'Liên Lạc' },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0e1a2b]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4 gap-8">
        
        {/* Logo / Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          <span className="text-3xl drop-shadow-[0_2px_8px_rgba(201,162,77,0.3)]">
            ⚔️
          </span>
          <span className="text-xl font-bold bg-gradient-to-br from-[#c9a24d] to-[#e2c77a] bg-clip-text text-transparent tracking-wide">
            HistoryTalk
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  relative py-2 text-[15px] font-medium tracking-wide transition-colors
                  ${isActive 
                    ? 'text-[#c9a24d]' 
                    : 'text-[#9a948c] hover:text-[#e7ddc8]'
                  }
                  group
                `}
              >
                {link.label}
                
                {/* Underline animation */}
                <span 
                  className={`
                    absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#c9a24d] to-[#e2c77a] transition-all duration-300
                    ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
                  `}
                />
              </Link>
            );
          })}
        </div>

        {/* CTA Button - Desktop */}
        <Link
          href="/start"
          className="
            hidden md:inline-flex
            group relative items-center gap-2 px-6 py-2.5
            bg-gradient-to-br from-[#c9a24d] to-[#c46a2f]
            text-[#0e1a2b] text-[15px] font-semibold
            rounded-[10px] shadow-[0_4px_16px_rgba(201,162,77,0.25)]
            hover:shadow-[0_8px_24px_rgba(201,162,77,0.35)]
            hover:-translate-y-0.5
            active:translate-y-0
            transition-all duration-300
            overflow-hidden
          "
        >
          {/* Shine effect */}
          <span className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <span className="relative">Bắt Đầu Ngay</span>
          
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            className="relative group-hover:translate-x-1 transition-transform duration-300"
          >
            <path 
              d="M6 3L11 8L6 13" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Mobile Menu - Sheet */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="md:hidden flex items-center justify-center w-10 h-10 bg-[#1a2436] border border-white/10 rounded-lg hover:bg-[#24314a] transition-colors">
              <Menu className="w-5 h-5 text-[#e7ddc8]" />
            </button>
          </SheetTrigger>
          
          <SheetContent 
            side="right" 
            className="w-[300px] bg-[#1a2436] border-l border-white/10 text-[#e7ddc8]"
          >
            <div className="flex flex-col gap-8 mt-8">
              {/* Mobile Navigation Links */}
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        px-4 py-3 rounded-lg text-base font-medium transition-all
                        ${isActive 
                          ? 'bg-[#c9a24d]/10 text-[#c9a24d] border-l-2 border-[#c9a24d]' 
                          : 'text-[#9a948c] hover:text-[#e7ddc8] hover:bg-[#24314a]'
                        }
                      `}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile CTA Button */}
              <Link
                href="/start"
                onClick={() => setIsOpen(false)}
                className="
                  group relative inline-flex items-center justify-center gap-2 px-6 py-3
                  bg-gradient-to-br from-[#c9a24d] to-[#c46a2f]
                  text-[#0e1a2b] text-base font-semibold
                  rounded-[10px] shadow-[0_4px_16px_rgba(201,162,77,0.25)]
                  hover:shadow-[0_8px_24px_rgba(201,162,77,0.35)]
                  transition-all duration-300
                  overflow-hidden
                "
              >
                <span className="absolute inset-0 -left-full group-hover:left-full transition-all duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <span className="relative">Bắt Đầu Ngay</span>
                
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none"
                  className="relative"
                >
                  <path 
                    d="M6 3L11 8L6 13" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}