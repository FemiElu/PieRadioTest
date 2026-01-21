import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-context";
import { AudioProvider } from "@/context/audio-context";
import { PersistentPlayer } from "@/components/player/persistent-player";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Pie Radio",
  description: "The number one station for the youth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, outfit.variable, "font-sans min-h-screen bg-background text-foreground antialiased")}>
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
      </body>
    </html>
  );
}
