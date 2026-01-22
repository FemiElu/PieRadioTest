"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
    Mail,
    MessageSquare,
    CheckCircle,
    Trash2,
    Reply,
    Loader2,
    ChevronDown,
    ChevronUp,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { markPresenterMessageAsRead, PresenterMessage } from "@/actions/presenter-messages";

interface PresenterMessagesListProps {
    initialMessages: PresenterMessage[];
}

export function PresenterMessagesList({ initialMessages = [] }: PresenterMessagesListProps) {
    // We use state to allow optimistic updates (marking as read locally)
    const [messages, setMessages] = useState<PresenterMessage[]>(initialMessages);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

    const markAsRead = async (messageId: string, currentStatus: boolean) => {
        if (currentStatus) return; // Already read

        // Optimistic update
        setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, is_read: true } : msg
        ));

        // Background server call
        try {
            const result = await markPresenterMessageAsRead(messageId);
            if (!result.success) {
                // Revert on failure (optional, but good practice)
                console.error("Failed to mark as read:", result.error);
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId ? { ...msg, is_read: false } : msg
                ));
            }
        } catch (error) {
            console.error("Error marking message as read:", error);
        }
    };

    const toggleExpand = (messageId: string, isRead: boolean) => {
        if (expandedMessageId === messageId) {
            setExpandedMessageId(null);
        } else {
            setExpandedMessageId(messageId);
            if (!isRead) {
                markAsRead(messageId, isRead);
            }
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <Card className="w-full border-border/50 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Messages
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="ml-2 rounded-full px-2">
                                    {unreadCount} new
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Manage inquiries and messages from your listeners.
                        </CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Input
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-4 rounded-xl"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {filteredMessages.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">No messages found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery
                                ? "Try adjusting your search query."
                                : "You haven't received any messages yet."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`
                                    transition-colors hover:bg-muted/30
                                    ${!msg.is_read ? "bg-primary/5 hover:bg-primary/10" : ""}
                                `}
                            >
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => toggleExpand(msg.id, msg.is_read)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-semibold ${!msg.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {msg.sender_name}
                                                </span>
                                                {!msg.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                                )}
                                                <span className="text-xs text-muted-foreground ml-auto md:ml-2 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium text-muted-foreground mb-1">
                                                {msg.sender_email}
                                            </div>
                                            <div className={`
                                                text-sm text-foreground/80 line-clamp-2
                                                ${expandedMessageId === msg.id ? "line-clamp-none whitespace-pre-wrap" : ""}
                                            `}>
                                                {msg.message}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 rounded-full h-8 w-8 p-0"
                                        >
                                            {expandedMessageId === msg.id ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {expandedMessageId === msg.id && (
                                    <div className="px-4 pb-4 pt-0 flex items-center justify-end gap-2 animate-in slide-in-from-top-2 duration-200">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="rounded-lg gap-2"
                                            asChild
                                        >
                                            <a href={`mailto:${msg.sender_email}?subject=Re: Message from Pie Radio listener`}>
                                                <Reply className="w-4 h-4" />
                                                Reply via Email
                                            </a>
                                        </Button>
                                        {!msg.is_read && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="rounded-lg gap-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead(msg.id, msg.is_read);
                                                }}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark as Read
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
