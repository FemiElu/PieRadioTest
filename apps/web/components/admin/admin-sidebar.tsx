"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Music, ShieldAlert } from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Moderation Queue",
    href: "/admin/moderation",
    icon: ShieldAlert,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Schedule / Shows",
    href: "/admin/schedule", // Future proofing
    icon: Music,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-[#0a0a0b] border-r border-zinc-800 h-screen sticky top-0 hidden lg:flex flex-col">
      <div className="p-8 pb-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black font-display tracking-tight text-white leading-none">PIE <span className="text-primary italic">RADIO</span></span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Admin Portal</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-4 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Main Menu</span>
        </div>

        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(51,74,255,0.1)]"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-zinc-500 group-hover:text-white"
              )} />
              <span className="font-bold text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-zinc-800/50">
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-bold text-zinc-500 uppercase">Current Session</span>
            <span className="text-xs font-bold text-white truncate">Admin User</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest text-center mt-6">
          v1.0.4-stable
        </p>
      </div>
    </div>
  );
}
