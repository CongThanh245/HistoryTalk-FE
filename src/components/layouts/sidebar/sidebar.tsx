// 'use client';

// import { cn } from '@/lib/utils/cn';
// import { usePathname } from 'next/navigation';
// import Link from 'next/link';
// import { ChevronDown } from 'lucide-react';
// import { useState } from 'react';
// import { useAuth } from '@/lib/hooks/use-auth';
// import { useNavigation } from '@/lib/hooks/use-navigation';
// import { Badge } from '@/components/ui/badge';
// import type { NavItem } from '@/routes/navigation';

// export function Sidebar() {
//   const pathname = usePathname();
//   const { user } = useAuth();
//   const navigation = useNavigation();

//   if (!user) return null;

//   return (
//     <aside className="w-64 border-r bg-background h-screen sticky top-0 flex flex-col">
//       {/* Logo */}
//       <div className="h-16 border-b flex items-center px-6">
//         <Link href="/" className="flex items-center gap-2">
//           <div className="h-8 w-8 rounded-lg bg-primary" />
//           <span className="font-bold text-lg">Core App</span>
//         </Link>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 overflow-y-auto p-4 space-y-6">
//         {navigation.map((section) => (
//           <NavSection key={section.id} section={section} />
//         ))}
//       </nav>

//       {/* User Info */}
//       <div className="border-t p-4">
//         <div className="flex items-center gap-3">
//           <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
//             <span className="text-sm font-semibold">
//               {user.name
//                 ?.split(' ')
//                 .map((n) => n[0])
//                 .join('')
//                 .toUpperCase()}
//             </span>
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-sm font-medium truncate">{user.name}</p>
//             <p className="text-xs text-muted-foreground capitalize">
//               {user.role}
//             </p>
//           </div>
//         </div>
//       </div>
//     </aside>
//   );
// }

// function NavSection({ section }: { section: any }) {
//   // Don't show empty sections
//   if (!section.items || section.items.length === 0) {
//     return null;
//   }

//   return (
//     <div>
//       <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
//         {section.title}
//       </h3>
//       <div className="space-y-1">
//         {section.items.map((item: NavItem) => (
//           <NavItemComponent key={item.id} item={item} />
//         ))}
//       </div>
//     </div>
//   );
// }

// function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
//   const pathname = usePathname();
//   const [isOpen, setIsOpen] = useState(false);

//   const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
//   const hasChildren = item.children && item.children.length > 0;

//   const Icon = item.icon;

//   const handleClick = (e: React.MouseEvent) => {
//     if (hasChildren) {
//       e.preventDefault();
//       setIsOpen(!isOpen);
//     }
//   };

//   return (
//     <div>
//       <Link
//         href={item.href}
//         onClick={handleClick}
//         className={cn(
//           'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
//           'hover:bg-accent hover:text-accent-foreground',
//           isActive && 'bg-primary text-primary-foreground hover:bg-primary/90',
//           depth > 0 && 'ml-4'
//         )}
//       >
//         <Icon className={cn('h-4 w-4', depth > 0 && 'h-3 w-3')} />
//         <span className="flex-1">{item.label}</span>
        
//         {item.badge && (
//           <Badge variant="secondary" className="h-5 px-1.5">
//             {item.badge}
//           </Badge>
//         )}

//         {hasChildren && (
//           <ChevronDown
//             className={cn(
//               'h-4 w-4 transition-transform',
//               isOpen && 'rotate-180'
//             )}
//           />
//         )}
//       </Link>

//       {hasChildren && isOpen && (
//         <div className="mt-1 space-y-1">
//           {item.children!.map((child) => (
//             <NavItemComponent
//               key={child.id}
//               item={child}
//               depth={depth + 1}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import React from 'react'

function Sidebar() {
  return (
    <div>Sidebar</div>
  )
}

export default Sidebar;