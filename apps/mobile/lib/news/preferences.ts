import AsyncStorage from "@react-native-async-storage/async-storage";

const NEWS_PREFERENCES_KEY = "news.preferences.v1";

export type NewsPreferences = {
  selectedCategory: string;
  bookmarkedSlugs: string[];
};

const DEFAULT_PREFERENCES: NewsPreferences = {
  selectedCategory: "all",
  bookmarkedSlugs: [],
};

export async function loadNewsPreferences(): Promise<NewsPreferences> {
  const raw = await AsyncStorage.getItem(NEWS_PREFERENCES_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<NewsPreferences>;
    return {
      selectedCategory: parsed.selectedCategory ?? "all",
      bookmarkedSlugs: Array.isArray(parsed.bookmarkedSlugs) ? parsed.bookmarkedSlugs : [],
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveNewsPreferences(preferences: NewsPreferences): Promise<void> {
  await AsyncStorage.setItem(NEWS_PREFERENCES_KEY, JSON.stringify(preferences));
}

export function toggleBookmarkedSlug(preferences: NewsPreferences, slug: string): NewsPreferences {
  const exists = preferences.bookmarkedSlugs.includes(slug);
  return {
    ...preferences,
    bookmarkedSlugs: exists
      ? preferences.bookmarkedSlugs.filter((item) => item !== slug)
      : [...preferences.bookmarkedSlugs, slug],
  };
}

