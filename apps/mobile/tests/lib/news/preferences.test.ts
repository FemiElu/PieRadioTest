import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadNewsPreferences,
  saveNewsPreferences,
  toggleBookmarkedSlug,
} from "@/lib/news/preferences";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("news preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads defaults when storage is empty", async () => {
    mockedAsyncStorage.getItem.mockResolvedValue(null);
    const prefs = await loadNewsPreferences();
    expect(prefs.selectedCategory).toBe("all");
    expect(prefs.bookmarkedSlugs).toEqual([]);
  });

  it("toggles bookmark slugs", () => {
    const prefs = { selectedCategory: "all", bookmarkedSlugs: ["a"] };
    const added = toggleBookmarkedSlug(prefs, "b");
    const removed = toggleBookmarkedSlug(added, "a");
    expect(added.bookmarkedSlugs).toEqual(["a", "b"]);
    expect(removed.bookmarkedSlugs).toEqual(["b"]);
  });

  it("persists preferences", async () => {
    await saveNewsPreferences({ selectedCategory: "Music", bookmarkedSlugs: ["slug-1"] });
    expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
  });
});

