"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, User, X, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
    { name: "Home", href: "/" },
    { name: "Schedule", href: "/schedule" },
    { name: "Presenters", href: "/presenters" },
    { name: "Events", href: "/events" },
    { name: "News", href: "/press" },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { user, profile, signOut, isLoading } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

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

                        {/* Auth Buttons / User Menu */}
                        {mounted && !isLoading && (
                            <>
                                {user ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full">
                                                <User className="h-5 w-5" />
                                                <span className="sr-only">Account</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>
                                                <div className="flex flex-col space-y-1">
                                                    <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                                                    <p className="text-xs leading-none text-muted-foreground">{profile?.email || user.email}</p>
                                                </div>
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            {(profile?.role === 'admin' || profile?.role === 'presenter') && (
                                                <DropdownMenuItem asChild>
                                                    <Link href={profile.role === 'admin' ? "/admin" : "/dashboard/presenter"} className="cursor-pointer">
                                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                                        Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem asChild>
                                                <Link href="/profile" className="cursor-pointer">
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Settings & Profile
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-red-600 focus:text-red-600">
                                                <LogOut className="mr-2 h-4 w-4" />
                                                Log out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <div className="hidden md:flex items-center gap-2">
                                        <Button variant="ghost" asChild>
                                            <Link href="/login">Sign In</Link>
                                        </Button>
                                        <Button asChild>
                                            <Link href="/signup">Sign Up</Link>
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

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

                    <div className="mt-4 flex flex-col gap-4">
                        {mounted && !user && !isLoading && (
                            <>
                                <Button asChild className="w-full" size="lg">
                                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                                </Button>
                                <Button variant="outline" asChild className="w-full" size="lg">
                                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                                </Button>
                            </>
                        )}
                        {mounted && user && (
                            <>
                                <div className="border-t border-border/40 pt-4 mt-2">
                                    <div className="flex items-center gap-3 mb-4 px-2">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{profile?.full_name || "User"}</p>
                                            <p className="text-xs text-muted-foreground">{profile?.email || user.email}</p>
                                        </div>
                                    </div>

                                    {(profile?.role === 'admin' || profile?.role === 'presenter') && (
                                        <Link
                                            href={profile.role === 'admin' ? "/admin" : "/dashboard/presenter"}
                                            className="flex items-center gap-2 p-2 hover:bg-accent rounded-md mb-2"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <LayoutDashboard className="h-4 w-4" />
                                            Dashboard
                                        </Link>
                                    )}

                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 p-2 hover:bg-accent rounded-md mb-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Settings & Profile
                                    </Link>

                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            signOut();
                                            setIsMenuOpen(false);
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log Out
                                    </Button>
                                </div>
                            </>
                        )}

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
