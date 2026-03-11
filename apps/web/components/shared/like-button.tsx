'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LikeButtonProps {
    isLiked: boolean;
    onToggle: () => Promise<{ liked: boolean }>;
    size?: 'sm' | 'md' | 'lg';
    /** Custom class names for the button wrapper */
    className?: string;
    /** Show a text label next to the icon */
    showLabel?: boolean;
    label?: string;
}

export function LikeButton({
    isLiked: initialIsLiked,
    onToggle,
    size = 'md',
    className,
    showLabel = false,
    label = 'Like',
}: LikeButtonProps) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isPending, startTransition] = useTransition();

    const handleClick = (e: React.MouseEvent) => {
        // Prevent click bubbling to parent links (e.g. presenter card)
        e.preventDefault();
        e.stopPropagation();

        const prev = isLiked;
        // Optimistic update
        setIsLiked(!prev);

        startTransition(async () => {
            try {
                const result = await onToggle();
                if ((result as any).error) {
                    throw new Error((result as any).error);
                }
                setIsLiked(result.liked);
                if (result.liked) {
                    toast.success('Added to your favourites!');
                } else {
                    toast.success('Removed from favourites.');
                }
            } catch (error: any) {
                // Revert on error
                setIsLiked(prev);
                const message = error.message === 'NEXT_REDIRECT'
                    ? 'Please sign in to save favourites.'
                    : 'Failed to update favourites. Please try again.';
                toast.error(message);
            }
        });
    };

    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            aria-label={isLiked ? 'Remove from favourites' : 'Add to favourites'}
            className={cn(
                'flex items-center gap-1.5 transition-all duration-200',
                'hover:scale-110 active:scale-95',
                isPending && 'opacity-60 pointer-events-none',
                className
            )}
        >
            <Heart
                className={cn(
                    iconSize,
                    'transition-all duration-200',
                    isLiked
                        ? 'fill-red-500 stroke-red-500'
                        : 'fill-transparent stroke-current text-zinc-400 hover:stroke-red-400'
                )}
            />
            {showLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider">
                    {label}
                </span>
            )}
        </button>
    );
}
