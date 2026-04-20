import { fireEvent, render, screen } from "@testing-library/react-native";
import NewsScreen from "@/app/(tabs)/news";
import { router } from "expo-router";
import { useNews } from "@/hooks/useNews";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/hooks/useNews", () => ({
  useNews: jest.fn(),
}));

jest.mock("@/components/news/NewsFeaturedCard", () => ({
  NewsFeaturedCard: ({ article, onPress }: { article: { title: string; slug: string }; onPress: (slug: string) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable onPress={() => onPress(article.slug)}>
        <Text>{article.title}</Text>
      </Pressable>
    );
  },
}));

jest.mock("@/components/news/NewsListItem", () => ({
  NewsListItem: ({ article, onPress }: { article: { title: string; slug: string }; onPress: (slug: string) => void }) => {
    const React = require("react");
    const { Pressable, Text } = require("react-native");
    return (
      <Pressable onPress={() => onPress(article.slug)}>
        <Text>{article.title}</Text>
      </Pressable>
    );
  },
}));

const mockedUseNews = useNews as jest.MockedFunction<typeof useNews>;

describe("News tab", () => {
  it("renders loading state", () => {
    mockedUseNews.mockReturnValue({
      featured: null,
      articles: [],
      loading: true,
      loadingMore: false,
      error: null,
      refreshing: false,
      hasMore: false,
      selectedCategory: "all",
      bookmarkedSlugs: [],
      searchTerm: "",
      setSearchTerm: jest.fn(),
      setCategory: jest.fn(),
      toggleBookmark: jest.fn(),
      refresh: jest.fn(),
      loadMore: jest.fn(),
    });

    render(<NewsScreen />);
    expect(screen.getByText("Loading news...")).toBeTruthy();
  });

  it("navigates when pressing a latest item", () => {
    mockedUseNews.mockReturnValue({
      featured: null,
      articles: [
        {
          id: "2",
          slug: "mobile-news",
          title: "Mobile News",
          summary: "Summary",
          cover_image_url: null,
          author_name: "Team",
          tier: "update",
          category: "News",
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
      loading: false,
      loadingMore: false,
      error: null,
      refreshing: false,
      hasMore: false,
      selectedCategory: "all",
      bookmarkedSlugs: [],
      searchTerm: "",
      setSearchTerm: jest.fn(),
      setCategory: jest.fn(),
      toggleBookmark: jest.fn(),
      refresh: jest.fn(),
      loadMore: jest.fn(),
    });

    render(<NewsScreen />);
    fireEvent.press(screen.getByText("Mobile News"));
    expect(router.push).toHaveBeenCalledWith("/news/mobile-news");
  });
});

