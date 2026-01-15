import Image from "next/image";
import Link from "next/link";

interface RelatedPresenter {
    id: string;
    full_name: string | null;
    slug: string | null;
    avatar_url: string | null;
}

interface RelatedPresentersProps {
    presenters: RelatedPresenter[];
}

export function RelatedPresenters({ presenters }: RelatedPresentersProps) {
    if (presenters.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-6">
            {presenters.map((presenter) => (
                <Link
                    key={presenter.id}
                    href={`/presenters/${presenter.slug || presenter.id}`}
                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-zinc-50 transition-colors"
                >
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-violet-600 to-purple-700 shadow-lg group-hover:scale-105 transition-transform">
                        {presenter.avatar_url ? (
                            <Image
                                src={presenter.avatar_url}
                                alt={presenter.full_name || "Presenter"}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30 text-4xl font-bold">
                                {(presenter.full_name || "P").charAt(0)}
                            </div>
                        )}
                    </div>
                    <p className="font-bold text-foreground text-center group-hover:text-primary transition-colors">
                        {presenter.full_name || "Presenter"}
                    </p>
                </Link>
            ))}
        </div>
    );
}
