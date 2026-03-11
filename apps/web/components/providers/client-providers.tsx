"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Load AudioProvider dynamically to avoid SSR of icecast-metadata-player
// which uses Web Workers not available on the server.
const AudioProvider = dynamic(
    () => import("@/context/audio-context").then((mod) => mod.AudioProvider),
    { ssr: false }
);

const PersistentPlayer = dynamic(
    () => import("@/components/player/persistent-player").then((mod) => mod.PersistentPlayer),
    { ssr: false }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AudioProvider>
                <Header />
                <main className="flex min-h-screen flex-col flex-1 pb-24">
                    {children}
                </main>
                <Footer />
                <PersistentPlayer />
            </AudioProvider>
        </AuthProvider>
    );
}
