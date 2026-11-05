"use client";

import dynamic from "next/dynamic";
import { AuthProvider } from "@/context/auth-context";
import { AudioProvider } from "@/context/audio-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// The audio engine loads in AudioProvider's browser effect. Rendering the
// provider normally lets page content reach the browser in the server HTML.

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
