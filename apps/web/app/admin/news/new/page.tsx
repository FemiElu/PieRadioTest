import { NewsArticleForm } from "@/components/admin/news-article-form";

export const metadata = {
    title: "New Article | Admin",
};

export default function NewArticlePage() {
    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                    Create New Article
                </h1>
                <p className="text-zinc-500 mt-1">
                    Publish breaking news, updates, or deep dives to the platform.
                </p>
            </div>

            <NewsArticleForm />
        </div>
    );
}
