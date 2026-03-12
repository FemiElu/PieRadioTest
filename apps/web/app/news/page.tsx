"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { InterestChips } from "@/components/news/InterestChips";
import { NewsHero } from "@/components/news/NewsHero";
import { NewsFeed } from "@/components/news/NewsFeed";
import { ArchiveCard } from "@/components/news/ArticleCards";
import { MOCK_ARTICLES, INTEREST_CHIPS } from "@/lib/mock-news";
import { TrendingUp, Clock, Search } from "lucide-react";
import { PreferencesModal, ShareModal } from "@/components/news/NewsModals";
import { cn } from "@/lib/utils";

export default function NewsPage() {
  const [selectedChips, setSelectedChips] = useState(["For You"]);
  const [isPrefOpen, setIsPrefOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [sharingArticle, setSharingArticle] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const breakingArticles = MOCK_ARTICLES.filter(a => a.tier === 'breaking');
  const trendingArticles = MOCK_ARTICLES.filter(a => a.tier === 'trending').slice(0, 3);
  const recentArticles = MOCK_ARTICLES.filter(a => a.tier === 'update').slice(0, 5);

  const toggleChip = (chip: string) => {
    setSelectedChips(prev =>
      prev.includes(chip)
        ? prev.filter(c => c !== chip)
        : [...prev, chip]
    );
  };

  const handleSavePref = (chips: string[]) => {
    setSelectedChips(chips);
    setIsPrefOpen(false);
  };

  return (
    <div className="min-h-screen bg-white pb-24">

      <main className="container max-w-screen-2xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Top Filtering Bar */}
        <div className="mb-8 sticky top-16 bg-white/80 backdrop-blur-md z-30 py-2 border-b border-zinc-100 flex items-center justify-between">
          <InterestChips
            chips={INTEREST_CHIPS}
            selectedChips={selectedChips}
            onToggle={toggleChip}
            onManage={() => setIsPrefOpen(true)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content (Left/Center) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* Breaking News Carousel */}
            <NewsHero articles={breakingArticles} />

            {/* Main Feed with Cadence */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display">Recent Stories</h2>
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <Clock className="w-4 h-4" />
                  Sorted by For You
                </div>
              </div>
              <NewsFeed articles={MOCK_ARTICLES} />
            </div>
          </div>

          {/* Right Rail (Desktop Only) */}
          <aside className="hidden lg:col-span-4 lg:flex flex-col gap-10">
            {/* Trending Section */}
            <div className="rounded-3xl border border-zinc-100 p-6 bg-zinc-50/50">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold font-display">Trending Now</h3>
              </div>
              <div className="flex flex-col gap-6">
                {trendingArticles.map((art, i) => (
                  <div key={art.id} className="flex gap-4 group cursor-pointer" onClick={() => {
                    setSharingArticle(art.title);
                    setIsShareOpen(true);
                  }}>
                    <span className="text-3xl font-bold text-zinc-200 group-hover:text-primary transition-colors">
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">
                        {art.title}
                      </h4>
                      <span className="text-xs text-zinc-500">{art.likes} reactions</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Updates List */}
            <div className="rounded-3xl border border-zinc-100 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-zinc-400" />
                <h3 className="text-xl font-bold font-display">Recent Updates</h3>
              </div>
              <div className="flex flex-col">
                {recentArticles.map((art) => (
                  <ArchiveCard key={art.id} article={art} />
                ))}
              </div>
            </div>

            {/* Newsletter / Join Waitlist CTA */}
            <div className="rounded-3xl bg-primary p-8 text-white">
              <h3 className="text-xl font-bold font-display mb-2">Stay in the loop</h3>
              <p className="text-zinc-200 text-sm mb-6">Receive daily radio highlights and breaking news directly.</p>
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button className="bg-white text-primary font-bold rounded-full py-2 hover:bg-zinc-100 transition-colors">
                  Join Newsletter
                </button>
              </div>
            </div>

            {/* Admin Prototype Toggle */}
            <div className="rounded-3xl border border-zinc-100 p-6 bg-zinc-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase text-zinc-400">Prototype Control</span>
                <span className="text-sm font-bold">Admin Tier View</span>
              </div>
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  isAdmin ? "bg-primary" : "bg-zinc-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  isAdmin ? "left-7" : "left-1"
                )} />
              </button>
            </div>
          </aside>
        </div>

        {/* Modals */}
        <PreferencesModal
          isOpen={isPrefOpen}
          onClose={() => setIsPrefOpen(false)}
          selectedChips={selectedChips}
          onSave={handleSavePref}
        />

        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          articleTitle={sharingArticle}
        />
      </main>
    </div>
  );
}
