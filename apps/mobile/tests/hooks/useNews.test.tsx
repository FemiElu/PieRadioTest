import { renderHook, waitFor, act } from "@testing-library/react-native";
import { useNews, __resetNewsCacheForTests } from "@/hooks/useNews";
import { fetchPublishedNewsCardsPage } from "@/lib/news/queries";

jest.mock("@/lib/news/queries", () => ({
  fetchPublishedNewsCardsPage: jest.fn(),
}));
jest.mock("@/lib/news/preferences", () => ({
  loadNewsPreferences: jest.fn(async () => ({ selectedCategory: "all", bookmarkedSlugs: [] })),
  saveNewsPreferences: jest.fn(async () => undefined),
  toggleBookmarkedSlug: jest.fn((preferences, slug) => ({
    ...preferences,
    bookmarkedSlugs: preferences.bookmarkedSlugs.includes(slug)
      ? preferences.bookmarkedSlugs.filter((item: string) => item !== slug)
      : [...preferences.bookmarkedSlugs, slug],
  })),
}));

const mockRemoveChannel = jest.fn();
const mockOn = jest.fn().mockReturnThis();
const mockSubscribe = jest.fn().mockReturnValue({ topic: "mobile_news_feed" });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: mockOn,
      subscribe: mockSubscribe,
    })),
    removeChannel: mockRemoveChannel,
  },
}));

const mockedFetch = fetchPublishedNewsCardsPage as jest.MockedFunction<typeof fetchPublishedNewsCardsPage>;

describe("useNews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetNewsCacheForTests();
  });

  it("selects a featured article and exposes latest list", async () => {
    mockedFetch.mockResolvedValue({
      articles: [
        {
          id: "1",
          slug: "daily-headline",
          title: "Daily Headline",
          summary: "Top story",
          cover_image_url: null,
          author_name: "Team",
          tier: "breaking",
          category: "Music",
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          slug: "late-night-update",
          title: "Late Night Update",
          summary: "Second story",
          cover_image_url: null,
          author_name: "Team",
          tier: "update",
          category: "Shows",
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      total: 2,
    });

    const { result } = renderHook(() => useNews());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.featured?.id).toBe("1");
    expect(result.current.articles).toHaveLength(1);
    expect(result.current.articles[0]?.id).toBe("2");
  });

  it("surfaces an error when initial fetch fails", async () => {
    mockedFetch.mockRejectedValue(new Error("Network down"));

    const { result } = renderHook(() => useNews());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("Network down");
    expect(result.current.featured).toBeNull();
    expect(result.current.articles).toHaveLength(0);
  });

  it("supports manual refresh", async () => {
    mockedFetch.mockResolvedValue({
      articles: [
        {
          id: "3",
          slug: "refresh-story",
          title: "Refresh Story",
          summary: "Updated",
          cover_image_url: null,
          author_name: "Team",
          tier: "trending",
          category: "News",
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      total: 1,
    });

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(mockedFetch.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it("loads next page when loadMore is called", async () => {
    mockedFetch
      .mockResolvedValueOnce({
        articles: [
          {
            id: "1",
            slug: "daily-headline",
            title: "Daily Headline",
            summary: "Top story",
            cover_image_url: null,
            author_name: "Team",
            tier: "breaking",
            category: "Music",
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
        total: 2,
      })
      .mockResolvedValueOnce({
        articles: [
          {
            id: "2",
            slug: "late-night-update",
            title: "Late Night Update",
            summary: "Second story",
            cover_image_url: null,
            author_name: "Team",
            tier: "update",
            category: "Shows",
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ],
        total: 2,
      });

    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(mockedFetch.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(mockedFetch).toHaveBeenLastCalledWith({
      page: 2,
      limit: 12,
      category: "all",
      search: "",
    });
  });

  it("refetches when realtime event arrives", async () => {
    mockedFetch.mockResolvedValue({
      articles: [],
      total: 0,
    });
    const { result } = renderHook(() => useNews());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const realtimeCallback = mockOn.mock.calls[0]?.[2];
    expect(typeof realtimeCallback).toBe("function");

    await act(async () => {
      await realtimeCallback?.({});
    });

    await waitFor(() => expect(mockedFetch.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});

