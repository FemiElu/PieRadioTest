import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ComingSoonProps {
    title: string;
    subtitle: string;
    icon?: LucideIcon;
    badge?: string;
    description?: string;
}

export function ComingSoon({
    title,
    subtitle,
    icon: Icon,
    badge = "Coming Soon",
    description
}: ComingSoonProps) {
    return (
        <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden px-4">
            {/* Background Decorations */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 -left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-primary/10 rounded-full blur-[140px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
            </div>

            <div className="relative z-10 max-w-3xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 animate-bounce">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    {badge}
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {Icon && (
                        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/10 transition-transform hover:scale-105 duration-500">
                            <Icon className="w-10 h-10 text-primary" />
                        </div>
                    )}

                    <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight leading-tight">
                        {title}
                        <span className="block text-primary">{subtitle}</span>
                    </h1>

                    {description && (
                        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button asChild size="lg" className="h-14 px-8 rounded-full text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105">
                        <Link href="/">Back to Home</Link>
                    </Button>
                    <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg font-bold backdrop-blur-sm border-2 transition-all hover:bg-primary/5">
                        <Link href="/schedule">View Schedule</Link>
                    </Button>
                </div>

                {/* Footer Quote */}
                <div className="pt-12 opacity-50 text-sm font-medium uppercase tracking-[0.3em]">
                    Pie Radio • The Vibe of the City
                </div>
            </div>
        </div>
    );
}
