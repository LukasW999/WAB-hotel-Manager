"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Briefcase, Bed, Calendar, TrendingUp } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    {
      href: "/reservierungen",
      label: "Reservierungen",
      icon: Calendar,
    },
    {
      href: "/zimmer",
      label: "Zimmer",
      icon: Bed,
    },
    {
      href: "/analysen",
      label: "Analysen & KPIs",
      icon: TrendingUp,
    },
    {
      href: "/mitarbeiter",
      label: "Mitarbeiter",
      icon: Briefcase,
    },
  ];

  return (
    <aside className="w-64 border-r bg-white dark:bg-slate-900 flex-col hidden md:flex min-h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <Building2 className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Grand Hotel</span>
      </div>
      <div className="p-4 flex-1">
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" 
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
