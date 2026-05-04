import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";

interface SimilarPresenter {
    id: string;
    full_name: string | null;
    slug: string | null;
    username: string | null;
    avatar_url: string | null;
}

interface SimilarPresentersProps {
    presenters: SimilarPresenter[];
}

export function SimilarPresenters({ presenters }: SimilarPresentersProps) {
    return (
        <div className="bg-white rounded-3xl border border-border p-6 md:p-8">
            <h2 className="text-xl font-bold font-display mb-6">Similar Presenters</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-4">
                {presenters.map((p) => (
                    <Link
                        key={p.id}
                        href={`/presenters/${p.slug || p.username || p.id}`}
                        className="group flex flex-col items-center text-center gap-2"
                    >
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors bg-muted">
                            {p.avatar_url ? (
                                <Image
                                    src={p.avatar_url}
                                    alt={p.full_name || "Presenter"}
                                    fill
                                    sizes="(max-width: 768px) 64px, 80px"
                                    className="object-cover transition-transform group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40">
                                    <User className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        <span className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {p.full_name || "Presenter"}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
