"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Send, User as UserIcon, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Filter } from "bad-words";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ChatMessage {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        username: string;
        full_name: string;
    };
    // We need to fetch profiles. In a real app we'd join. 
    // For realtime, we might only get the new row (no join). 
    // So we might need to fetch the user profile for the new message or just show "User".
    // Actually, standard pattern: 
    // 1. Initial Load: Select *, profiles(username)
    // 2. Realtime: Receive new row. Fetch profile for that user_id OR optimistic update if we knew the user (current user).
}

export function ChatBox() {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const supabase = createClient();
    const filter = new Filter();

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('*, profiles(username, full_name, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) {
                setMessages(data.reverse() as any);
                setTimeout(scrollToBottom, 100);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel('public:chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                },
                async (payload) => {
                    const newMsg = payload.new as ChatMessage;

                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('username, full_name, avatar_url')
                        .eq('id', newMsg.user_id)
                        .single();

                    const msgWithProfile = {
                        ...newMsg,
                        profiles: userData
                    } as any;

                    setMessages((prev) => [...prev, msgWithProfile]);
                    setTimeout(scrollToBottom, 50);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        if (filter.isProfane(newMessage)) {
            alert("Please keep the chat clean!");
            return;
        }

        setSending(true);
        const text = newMessage;
        setNewMessage("");

        const { error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: user.id,
                content: text
            } as any);

        if (error) {
            console.error("Failed to send", error);
            setNewMessage(text);
        }
        setSending(false);
    };

    return (
        <div className="flex flex-col h-[700px] bg-white border border-zinc-200 rounded-[32px] overflow-hidden shadow-2xl shadow-zinc-200/50">
            {/* Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full absolute -top-0.5 -right-0.5 border-2 border-white animate-pulse" />
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-zinc-400" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold font-display text-lg tracking-tight">Live Discussion</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pie Radio Community</p>
                    </div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    Realtime Feed
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-[#fafafb]/50" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                            <Send className="w-8 h-8 text-zinc-200" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-zinc-900">No messages yet</p>
                            <p className="text-sm text-zinc-400">Be the first to start the conversation!</p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = user?.id === msg.user_id;
                    return (
                        <div key={msg.id} className={cn("flex items-end gap-3", isMe ? 'flex-row-reverse' : 'flex-row')}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
                                    <UserIcon className="w-full h-full p-1.5 text-zinc-400" />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[75%] space-y-1.5",
                                isMe ? 'items-end' : 'items-start'
                            )}>
                                <div className={cn(
                                    "px-5 py-3 rounded-[24px] shadow-sm",
                                    isMe
                                        ? 'bg-primary text-white rounded-br-none shadow-primary/20'
                                        : 'bg-white text-zinc-800 rounded-bl-none border border-zinc-100'
                                )}>
                                    {!isMe && (
                                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-primary">
                                            {msg.profiles?.username || "Anonymous"}
                                        </p>
                                    )}
                                    <p className="text-sm font-medium leading-relaxed break-words">{msg.content}</p>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 px-1">
                                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <div className="p-8 bg-white border-t border-zinc-100">
                {user ? (
                    <form onSubmit={handleSend} className="relative group">
                        <input
                            className="w-full bg-[#f4f4f7] border-2 border-transparent rounded-[20px] pl-6 pr-16 py-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary/20 focus:bg-white transition-all shadow-inner"
                            placeholder="Type your message here..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                        />
                        <button
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            className="absolute right-2 top-2 bottom-2 px-4 rounded-[16px] bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                ) : (
                    <div className="text-center bg-zinc-50 rounded-[24px] p-6 border border-zinc-100">
                        <p className="text-sm font-bold text-zinc-900 mb-4">Join the conversation</p>
                        <Button variant="default" className="rounded-full px-8 font-bold shadow-lg shadow-primary/20" asChild>
                            <Link href="/login">Sign In to Chat</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
