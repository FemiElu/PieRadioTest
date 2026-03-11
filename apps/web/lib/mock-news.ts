export interface AudioMoment {
    label: string;
    timestamp: string;
    duration: number;
}

export type NewsTier = 'breaking' | 'trending' | 'update' | 'archive' | 'audio' | 'poll' | 'sponsor';

export interface NewsArticle {
    id: string;
    category: string;
    tier: NewsTier;
    title: string;
    summary: string;
    author: string;
    time: string;
    image_query?: string;
    imageUrl?: string;
    audio_moments?: AudioMoment[];
    audio_preview?: string;
    likes?: number;
    comments?: number;
    shares?: number;
    options?: string[];
    results?: number[];
}

export const MOCK_ARTICLES: NewsArticle[] = [
    {
        id: "a001",
        category: "Afrobeats",
        tier: "breaking",
        title: "Burna Boy announces surprise Lagos show after midnight set",
        summary: "Tickets live in 30 minutes — set starts at midnight.",
        author: "Chloe N.",
        time: "Feb 12, 2026 • 09:13",
        image_query: "lagos-concert",
        imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1200",
        audio_moments: [{ label: "Interview clip", timestamp: "00:01:34", duration: 45 }],
        likes: 3100,
        comments: 510,
        shares: 240
    },
    {
        id: "h002",
        category: "Hip-hop",
        tier: "trending",
        title: "New single from Skepta: a quick first listen (exclusive)",
        summary: "We break down the beat and the verses.",
        author: "Liam R.",
        time: "Feb 11, 2026 • 18:22",
        image_query: "music-studio",
        imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800",
        audio_moments: [{ label: "Beat drop", timestamp: "00:00:45", duration: 30 }],
        likes: 9600,
        comments: 1200,
        shares: 800
    },
    {
        id: "g003",
        category: "Gossip",
        tier: "update",
        title: "Rumour: Celebrity X spotted at Y club",
        summary: "Eyewitness accounts and five photos.",
        author: "Nina K.",
        time: "Feb 11, 2026 • 07:14",
        image_query: "celebrity-nightlife",
        imageUrl: "https://images.unsplash.com/photo-1514525253361-b83a85f0d9c0?auto=format&fit=crop&q=80&w=600",
        likes: 321,
        comments: 110
    },
    {
        id: "d004",
        category: "Shows",
        tier: "audio",
        title: "DJ Raha’s 90s mix snippet",
        summary: "A 2-minute throwback clip.",
        author: "DJ Raha",
        time: "Feb 10, 2026 • 23:45",
        image_query: "dj-deck",
        imageUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&q=80&w=600",
        audio_preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        likes: 2100
    },
    {
        id: "l005",
        category: "Local",
        tier: "update",
        title: "Station partners with Lagos market to create safer rides",
        summary: "Program to support late-night commuters.",
        author: "Community",
        time: "Feb 10, 2026 • 16:00",
        image_query: "market",
        imageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=600",
        likes: 420
    },
    {
        id: "p006",
        category: "Podcast",
        tier: "trending",
        title: "New episode: ‘Behind the Mic’ with Tina",
        summary: "Tina interviews a rising star.",
        author: "Tina M.",
        time: "Feb 09, 2026 • 09:00",
        image_query: "podcast-studio",
        imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=800",
        likes: 800
    },
    {
        id: "e007",
        category: "Lifestyle",
        tier: "trending",
        title: "How fashion is changing the Afrobeats stage look",
        summary: "Designers weigh in.",
        author: "J. Cole",
        time: "Feb 08, 2026",
        image_query: "fashion-runway",
        imageUrl: "https://images.unsplash.com/photo-1539109132332-629ee628a586?auto=format&fit=crop&q=80&w=800",
    },
    {
        id: "s008",
        category: "Music",
        tier: "update",
        title: "Footballer releases single — checking the crossover",
        summary: "The crossover between sport and music.",
        author: "Admin",
        time: "Feb 08, 2026",
        imageUrl: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=600",
    },
    {
        id: "a009",
        category: "Archive",
        tier: "archive",
        title: "Spotlight: 5 songs that shaped Tiwa Savage",
        summary: "A short retrospective.",
        author: "Archive Team",
        time: "Feb 07, 2026",
    },
    {
        id: "poll010",
        category: "Engagement",
        tier: "poll",
        title: "Which track should DJ Raha play tonight?",
        summary: "Vote for your favorite throwback.",
        author: "Pie Radio",
        time: "Feb 12, 2026",
        options: ["Track A", "Track B", "Track C"],
        results: [45, 35, 20]
    },
    {
        id: "ad011",
        category: "Sponsored",
        tier: "sponsor",
        title: "Headphones sale — sponsored",
        summary: "Get 20% off with code PIE20.",
        author: "Sponsor",
        time: "Ad",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
    },
    {
        id: "l012",
        category: "Local",
        tier: "breaking",
        title: "Delay on Routes X & Y: commuters updated",
        summary: "Expect delays until 10:00.",
        author: "Travel Desk",
        time: "Feb 12, 2026 • 08:30",
        imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1200",
    }
];

export const INTEREST_CHIPS = [
    "For You", "Afrobeats", "Hip-hop", "Gossip", "Shows",
    "Entertainment & Lifestyle", "Local", "Breaking", "Podcasts"
];
