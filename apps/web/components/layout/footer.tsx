import Link from "next/link";
import { cn } from "@/lib/utils";

export function Footer() {
    return (
        <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-12">
            <div className="container px-4 md:px-8 max-w-screen-2xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold font-display text-lg tracking-tight">
                            <span className="text-primary">PIE</span> RADIO
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            The number one station for the youth. Broadcasting the freshest hits and hottest talk 24/7.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase text-foreground/80">Explore</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/schedule" className="hover:text-primary transition-colors">Schedule</Link></li>
                            <li><Link href="/presenters" className="hover:text-primary transition-colors">Presenters</Link></li>
                            <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
                            <li><Link href="/news" className="hover:text-primary transition-colors">News</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase text-foreground/80">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm tracking-wide uppercase text-foreground/80">Connect</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Twitter / X</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">TikTok</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border/40 text-center md:text-left text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Pie Radio. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
