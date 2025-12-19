"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/schedule" },
    { name: "Presenters", href: "/presenters" },
    { name: "Events", href: "/events" },
    { name: "News", href: "/news" },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Close menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMenuOpen]);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link href="/" className="mr-6 flex items-center">
                            <Image
                                src="/assets/logo.png"
                                alt="Pie Radio"
                                width={500}
                                height={500}
                                className="h-12 w-auto object-contain"
                                priority
                            />
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "transition-colors hover:text-foreground/80 text-foreground/60"
                                    )}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:inline-flex hidden">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Search</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                            <User className="h-4 w-4" />
                            <span className="sr-only">Account</span>
                        </Button>
                        {/* Hamburger Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu - Higher z-index to cover header and player */}
            <div className={cn(
                "fixed inset-0 top-16 z-[60] bg-background md:hidden transition-all duration-300 ease-in-out shadow-xl",
                isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
            )}>
                <nav className="flex flex-col p-6 gap-4 h-full bg-background">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-lg font-semibold border-b border-border/40 pb-4 transition-colors hover:text-primary"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {item.name}
                        </Link>
                    ))}
                    <div className="mt-4">
                        <Button className="w-full justify-start gap-2" variant="outline">
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </nav>
            </div>
        </>
    );
}
