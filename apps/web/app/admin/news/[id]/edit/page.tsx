import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getArticleByIdAdmin } from "@/lib/news/queries";
import { NewsArticleForm } from "@/components/admin/news-article-form";

export const metadata = {
    title: "Edit Article | Admin",
};

export default async function EditArticlePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const article = await getArticleByIdAdmin(supabase, id);

    if (!article) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-3xl font-black font-display tracking-tight text-[#141827]">
                    Edit Article
                </h1>
                <p className="text-zinc-500 mt-1">Make changes to &quot;{article.title}&quot;</p>
            </div>

            <NewsArticleForm initialData={article} />
        </div>
    );
}
