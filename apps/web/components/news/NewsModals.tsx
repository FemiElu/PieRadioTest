"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { INTEREST_CHIPS } from "@/lib/mock-news";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedChips: string[];
    onSave: (chips: string[]) => void;
}

export function PreferencesModal({ isOpen, onClose, selectedChips, onSave }: PreferencesModalProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedChips);

    const toggleChip = (chip: string) => {
        setLocalSelected(prev =>
            prev.includes(chip)
                ? prev.filter(c => c !== chip)
                : [...prev, chip]
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-display">Manage Interests</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Tailor your Pie Radio feed. Select topics that matter to you.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-6">
                    {INTEREST_CHIPS.map((chip) => {
                        const isSelected = localSelected.includes(chip);
                        return (
                            <button
                                key={chip}
                                onClick={() => toggleChip(chip)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-bold transition-all",
                                    isSelected
                                        ? "bg-primary/5 border-primary text-primary"
                                        : "bg-zinc-50 border-zinc-100 text-zinc-600 hover:border-zinc-200"
                                )}
                            >
                                {chip}
                                {isSelected && <Check className="w-4 h-4" />}
                            </button>
                        );
                    })}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
                    <Button onClick={() => onSave(localSelected)} className="rounded-full px-8">Save Preferences</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Share Modal Component
export function ShareModal({ isOpen, onClose, articleTitle }: { isOpen: boolean; onClose: () => void; articleTitle: string }) {
    const platforms = [
        { name: 'X / Twitter', icon: '𝕏', color: 'bg-black' },
        { name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
        { name: 'Telegram', icon: '✈️', color: 'bg-blue-400' },
        { name: 'Copy Link', icon: '🔗', color: 'bg-zinc-800' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold font-display">Share Story</DialogTitle>
                    <DialogDescription className="line-clamp-1">{articleTitle}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-4 gap-4 py-8">
                    {platforms.map((p) => (
                        <button key={p.name} className="flex flex-col items-center gap-2 group">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-xl text-white shadow-lg transition-transform group-hover:-translate-y-1 group-active:scale-95",
                                p.color
                            )}>
                                {p.icon}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{p.name}</span>
                        </button>
                    ))}
                </div>

                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-400 truncate">pieradio.uk/news/{articleTitle.toLowerCase().replace(/ /g, '-').slice(0, 20)}</span>
                    <Button variant="ghost" size="sm" className="text-primary font-bold h-8">Copy</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
