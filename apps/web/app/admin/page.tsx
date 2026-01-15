import { ShieldCheck, Users, Clock, ArrowUpRight, Music2, MessageSquare } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-display tracking-tight text-[#141827]">Dashboard <span className="text-primary italic">Overview</span></h1>
          <p className="text-zinc-500 font-medium">Welcome back, Admin. Here&apos;s what&apos;s happening with Pie Radio today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors">
            <ShieldCheck className="w-4 h-4" />
            System Healthy
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Pending Review", value: "12", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", trend: "+2 today" },
          { label: "Total Users", value: "1,234", icon: Users, color: "text-primary", bg: "bg-primary/10", trend: "+15% week" },
          { label: "Active Listeners", value: "85", icon: Music2, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Live now" },
          { label: "Chat Messages", value: "450", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10", trend: "Last 24h" },
        ].map((stat, i) => (
          <div key={i} className="group p-6 bg-white rounded-3xl border border-zinc-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className={cn("p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {stat.trend}
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-black font-display tracking-tight text-zinc-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Content Sections could go here - e.g. Recent Activities, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 p-8 space-y-6 shadow-sm">
          <h3 className="text-2xl font-bold font-display tracking-tight">Recent Activity</h3>
          <div className="space-y-1">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 transition-colors group cursor-pointer border border-transparent hover:border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">New track submitted by ArtistXYZ</p>
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">Pending Review • 24 mins ago</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-zinc-50 group-hover:bg-primary/10 transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 space-y-6 text-[#141827] shadow-sm border border-zinc-100">
          <h3 className="text-xl font-bold font-display tracking-tight">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: "Update Schedule", icon: Clock },
              { label: "Send Broadcast", icon: Music2 },
              { label: "System Maintenance", icon: ShieldCheck },
            ].map((action, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all text-left font-bold text-sm">
                {action.label}
                <action.icon className="w-4 h-4 text-primary" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure cn is imported
import { cn } from "@/lib/utils";
