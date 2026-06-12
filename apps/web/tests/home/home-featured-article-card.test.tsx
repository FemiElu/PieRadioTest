import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import HomeClient from "@/app/home-client";

vi.mock("@/context/audio-context", () => ({
  useAudio: () => ({
    isPlaying: false,
    togglePlay: vi.fn(),
    isLoading: false,
    currentTrack: null,
  }),
}));

vi.mock("@/hooks/use-current-show", () => ({
  useCurrentShow: () => ({ currentShow: null }),
}));

vi.mock("@/hooks/use-schedule", () => ({
  useSchedule: () => ({ schedule: [], loading: false }),
}));

describe("Home Featured Article Card", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("links the featured card to the latest featured news article", () => {
    render(
      <HomeClient
        initialSpotlight={null}
        initialFeaturedArticle={{
          id: "article-1",
          slug: "daily-headline",
          title: "Daily Headline",
          summary: "Top story",
          cover_image_url: null,
          author_id: null,
          author_name: "Team",
          tier: "breaking",
          category: "Music",
          status: "published",
          is_breaking: false,
          is_featured: true,
          audio_preview_url: null,
          audio_moments: null,
          youtube_url: null,
          external_url: null,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }}
      />
    );

    const link = screen.getByRole("link", {
      name: /daily headline/i,
    });

    expect(link).toHaveAttribute("href", "/news/daily-headline");
  });
});
