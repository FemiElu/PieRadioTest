/**
 * Article Detail Page — Server Component
 *
 * Fetches a single published article by slug and renders it.
 * Generates SEO metadata dynamically from the article title/summary/image.
 * Returns a 404-style "not found" state if the slug doesn't match a published article.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getArticleBySlug } from "@/lib/news/queries";
import { Header } from "@/components/layout/header";
import { ArticleDetailClient } from "./article-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Generate metadata for SEO / social cards */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const article = await getArticleBySlug(supabase, slug);

  if (!article) {
    return { title: "Article Not Found | Pie Radio" };
  }

  return {
    title: `${article.title} | Pie Radio`,
    description: article.summary ?? undefined,
    openGraph: {
      title: article.title,
      description: article.summary ?? undefined,
      images: article.cover_image_url
        ? [{ url: article.cover_image_url, width: 1200, height: 630 }]
        : [],
      type: "article",
      publishedTime: article.published_at ?? undefined,
      authors: article.author_name ? [article.author_name] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary ?? undefined,
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  };
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const article = await getArticleBySlug(supabase, slug);

  if (!article) {
    notFound();
  }

  return <ArticleDetailClient article={article} />;
}
