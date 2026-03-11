"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Music, ShieldAlert, Mic2, ListMusic, UploadCloud } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";

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
    title: "Music Requests",
    href: "/admin/requests",
    icon: ListMusic,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Presenters",
    href: "/admin/presenters",
    icon: Mic2,
  },
  {
    title: "Schedule / Shows",
    href: "/admin/schedule", // Future proofing
    icon: Music,
  },
  {
    title: "Artist Uploads",
    href: "/admin/artist-uploads",
    icon: UploadCloud,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { profile, isLoading } = useAuth();

  return (
    <div className="w-72 bg-white border-r border-border h-screen sticky top-0 hidden lg:flex flex-col shadow-sm">
      <div className="p-8 pb-10">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black font-display tracking-tight text-[#141827] leading-none">PIE <span className="text-primary italic">RADIO</span></span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Admin Portal</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <div className="px-4 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Main Menu</span>
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
                  : "text-zinc-500 hover:text-[#141827] hover:bg-zinc-50"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "text-zinc-400 group-hover:text-[#141827]"
              )} />
              <span className="font-bold text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border/50">
        <div className="bg-zinc-50 rounded-2xl p-4 border border-border/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "User Avatar"}
                width={32}
                height={32}
                className="w-full h-full rounded-full object-cover shadow-sm"
              />
            ) : (
              <Users className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] font-bold text-zinc-400 uppercase truncate">
              {isLoading ? "Loading..." : (profile?.role || "System User")}
            </span>
            <span className="text-xs font-bold text-[#141827] truncate">
              {profile?.full_name || profile?.email || "Admin User"}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest text-center mt-6">
          v1.0.4-stable
        </p>
      </div>
    </div>
  );
}
