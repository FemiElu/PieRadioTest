import { render, screen, waitFor } from "@testing-library/react-native";
import NewsDetailScreen from "@/app/news/[slug]";
import { fetchPublishedArticleBySlug } from "@/lib/news/queries";

jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useLocalSearchParams: jest.fn(() => ({ slug: "daily-headline" })),
}));

jest.mock("@/lib/news/queries", () => ({
  fetchPublishedArticleBySlug: jest.fn(),
}));
jest.mock("@/lib/news/preferences", () => ({
  loadNewsPreferences: jest.fn(async () => ({ selectedCategory: "all", bookmarkedSlugs: [] })),
  saveNewsPreferences: jest.fn(async () => undefined),
  toggleBookmarkedSlug: jest.fn((preferences, slug) => ({
    ...preferences,
    bookmarkedSlugs: [...preferences.bookmarkedSlugs, slug],
  })),
}));

const mockedFetchBySlug =
  fetchPublishedArticleBySlug as jest.MockedFunction<typeof fetchPublishedArticleBySlug>;

describe("News detail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders fetched article content", async () => {
    mockedFetchBySlug.mockResolvedValue({
      id: "1",
      slug: "daily-headline",
      title: "Daily Headline",
      content: "Long-form article content.",
      summary: "Summary",
      cover_image_url: null,
      author_name: "Editorial Team",
      tier: "breaking",
      category: "News",
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      audio_preview_url: null,
    });

    render(<NewsDetailScreen />);

    await waitFor(() => expect(screen.getByText("Daily Headline")).toBeTruthy());
    expect(screen.getByText("Long-form article content.")).toBeTruthy();
  });

  it("renders empty-state error for missing article", async () => {
    mockedFetchBySlug.mockResolvedValue(null);

    render(<NewsDetailScreen />);

    await waitFor(() => expect(screen.getByText("Unable to open article")).toBeTruthy());
    expect(screen.getByText("Article not found.")).toBeTruthy();
  });
});

