"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  MessageSquare, 
  Radio, 
  Newspaper, 
  Settings, 
  Info,
  Mic2
} from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'track_update':
      return <Music className="h-4 w-4 text-blue-500" />;
    case 'song_request':
      return <Mic2 className="h-4 w-4 text-purple-500" />;
    case 'presenter_message':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'show_alert':
      return <Radio className="h-4 w-4 text-red-500" />;
    case 'news':
      return <Newspaper className="h-4 w-4 text-orange-500" />;
    default:
      return <Info className="h-4 w-4 text-zinc-500" />;
  }
};

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error("[NotificationBell] Failed to fetch notifications:", error);
          return;
        }

        if (!isMounted || !data) return;

        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      } catch (error) {
        console.error("[NotificationBell] Unexpected fetch error:", error);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new, ...prev].slice(0, 20));
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAsRead = async (id: string, is_read: boolean) => {
    if (is_read) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: true })
        .eq("id", id);

      if (error) {
        console.error("[NotificationBell] Failed to mark notification as read:", error);
      }
    } catch (error) {
      console.error("[NotificationBell] Unexpected markAsRead error:", error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from("notifications" as any)
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false);

      if (error) {
        console.error("[NotificationBell] Failed to mark all notifications as read:", error);
      }
    } catch (error) {
      console.error("[NotificationBell] Unexpected markAllAsRead error:", error);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-zinc-100 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-background animate-in fade-in zoom-in duration-300"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-0 overflow-hidden rounded-xl border-border/40 shadow-2xl animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 backdrop-blur-sm">
          <DropdownMenuLabel className="p-0 font-bold text-sm tracking-tight text-foreground">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors">
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-zinc-300" />
              </div>
              <p className="font-medium">All caught up!</p>
              <span className="text-xs opacity-60">You have no new notifications.</span>
            </div>
          ) : (
            notifications.map((notification) => {
              const content = (
                <div 
                  onClick={() => markAsRead(notification.id, notification.is_read)} 
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-zinc-50/80 transition-all border-b border-border/40 last:border-0 ${!notification.is_read ? 'bg-primary/[0.03] border-l-2 border-l-primary shadow-[inset_0_0_1px_rgba(0,0,0,0.05)]' : 'border-l-2 border-l-transparent'}`}
                >
                  <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!notification.is_read ? 'bg-white shadow-sm ring-1 ring-zinc-200' : 'bg-zinc-50 opacity-60'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className={`text-sm leading-none truncate ${!notification.is_read ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {notification.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap mt-0.5">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${!notification.is_read ? 'text-foreground/80' : 'text-muted-foreground/80'} line-clamp-2`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              );

              if (notification.link_url) {
                return (
                  <Link key={notification.id} href={notification.link_url} className="block group">
                    {content}
                  </Link>
                );
              }

              return <div key={notification.id}>{content}</div>;
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
