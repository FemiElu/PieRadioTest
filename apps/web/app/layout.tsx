import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ClientProviders } from "@/components/providers/client-providers";

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
        <ClientProviders>
          {children}
          <Toaster position="top-right" richColors />
        </ClientProviders>
      </body>
    </html>
  );
}
