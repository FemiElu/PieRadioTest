import { ChatBox } from "@/components/chat/chat-box";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
    return (
        <div className="flex flex-col w-full min-h-screen bg-[#fcfcfd]">
            {/* Page Header */}
            <section className="bg-zinc-950 text-white pt-24 pb-12">
                <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto">
                    <div className="max-w-3xl space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                            <MessageSquare className="w-3 h-3" />
                            Community Hub
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-tight">
                            Live <span className="text-primary italic">Chat</span>
                        </h1>
                        <p className="text-lg text-zinc-400 font-medium">
                            Join the conversation with other listeners and Pie Radio presenters in real-time.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container max-w-screen-2xl mx-auto py-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <ChatBox />
                </div>
            </section>
        </div>
    );
}
