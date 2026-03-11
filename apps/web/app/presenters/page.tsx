import { createClient } from "@/lib/supabase/server";
import { PresentersClient } from "@/components/presenters/presenters-client";
import { getUserLikedIds } from "@/app/actions/favourites";

export const revalidate = 3600; // Revalidate every hour

export const metadata = {
    title: "Presenters | Pie Radio",
    description: "Meet the Pie Radio team. Your favorite voices, bringing you the best in music and entertainment.",
};

// Executive Leadership Team Data
const EXECUTIVES_DATA = [
    {
        id: "e1",
        full_name: "Miz",
        username: "miz",
        slug: "miz",
        avatar_url: null,
        bio: "Executive Director at Pie Radio.",
        is_live: false,
        presenter_meta: { category: "Executive Leadership", instagram_handle: "miz", twitter_handle: null },
        shows: [],
    },
    {
        id: "e2",
        full_name: "Solomon",
        username: "solomon",
        slug: "solomon",
        avatar_url: null,
        bio: "Director of Operations.",
        is_live: false,
        presenter_meta: { category: "Executive Leadership", instagram_handle: null, twitter_handle: null },
        shows: [],
    },
];

// Senior Leadership Team Data
const SENIOR_LEADERSHIP_DATA = [
    {
        id: "s1",
        full_name: "Jason Da Costa",
        username: "jason-da-costa",
        slug: "jason-da-costa",
        avatar_url: null,
        bio: "Head of Content.",
        is_live: false,
        presenter_meta: { category: "Senior Leadership", instagram_handle: "jason-da-costa", twitter_handle: "jason-da-costa" },
        shows: [],
    },
    {
        id: "s2",
        full_name: "Adiva Destiny",
        username: "adiva-destiny",
        slug: "adiva-destiny",
        avatar_url: null,
        bio: "Head of Music.",
        is_live: false,
        presenter_meta: { category: "Senior Leadership", instagram_handle: "adiva-destiny", twitter_handle: "adiva-destiny" },
        shows: [],
    },
];

// Dummy data for initial display (will be replaced by real data)
const DUMMY_PRESENTERS = [
    {
        id: "1",
        full_name: "Alex Thompson",
        username: "alex-thompson",
        slug: "alex-thompson",
        avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
        bio: "Morning show host with 10 years of radio experience.",
        is_live: false,
        presenter_meta: { category: "afrobeats", instagram_handle: "alexthompson", twitter_handle: "alexthompson" },
        shows: [{ title: "Morning Rise", description: "Wake up with energy" }],
    },
    {
        id: "2",
        full_name: "Sarah Wilson",
        username: "sarah-wilson",
        slug: "sarah-wilson",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
        bio: "Bringing you the best midday hits.",
        is_live: true,
        presenter_meta: { category: "amapiano", instagram_handle: "sarahwilson", twitter_handle: "sarahwilson" },
        shows: [{ title: "Midday Mix", description: "Weekdays 10am-2pm" }],
    },
    {
        id: "3",
        full_name: "Jamie Lee",
        username: "jamie-lee",
        slug: "jamie-lee",
        avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
        bio: "Drive time specialist keeping you company.",
        is_live: false,
        presenter_meta: { category: "rap-hiphop", instagram_handle: "jamielee", twitter_handle: null },
        shows: [{ title: "Drive Time", description: "Weekdays 4-7pm" }],
    },
    {
        id: "4",
        full_name: "Rachel Martinez",
        username: "rachel-martinez",
        slug: "rachel-martinez",
        avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80",
        bio: "Evening vibes and smooth transitions.",
        is_live: false,
        presenter_meta: { category: "rnb", instagram_handle: "rachelmartinez", twitter_handle: "rachelmartinez" },
        shows: [{ title: "Evening Vibes", description: "Weekdays 7-10pm" }],
    },
    {
        id: "5",
        full_name: "Marcus Chen",
        username: "marcus-chen",
        slug: "marcus-chen",
        avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
        bio: "80s hits specialist and music historian.",
        is_live: false,
        presenter_meta: { category: "house", instagram_handle: null, twitter_handle: "marcuschen" },
        shows: [{ title: "80s Flashback", description: "Weekends" }],
    },
    {
        id: "6",
        full_name: "Amara Okonkwo",
        username: "amara-okonkwo",
        slug: "amara-okonkwo",
        avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
        bio: "Afrobeats queen bringing you the hottest sounds.",
        is_live: false,
        presenter_meta: { category: "afrobeats", instagram_handle: "amaraokonkwo", twitter_handle: "amaraokonkwo" },
        shows: [{ title: "Afro Fusion", description: "Fridays & Saturdays" }],
    },
    {
        id: "7",
        full_name: "David Stone",
        username: "david-stone",
        slug: "david-stone",
        avatar_url: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=800&q=80",
        bio: "Rock classics and guitar legends.",
        is_live: false,
        presenter_meta: { category: "sports", instagram_handle: "davidstone", twitter_handle: null },
        shows: [{ title: "Rock Hour", description: "Sundays" }],
    },
    {
        id: "8",
        full_name: "Emma Richards",
        username: "emma-richards",
        slug: "emma-richards",
        avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80",
        bio: "Late night sessions and indie discoveries.",
        is_live: false,
        presenter_meta: { category: "rnb", instagram_handle: "emmarichards", twitter_handle: "emmarichards" },
        shows: [{ title: "Late Night Sessions", description: "Weeknights 10pm-12am" }],
    },
];

export default async function PresentersPage() {
    const supabase = await createClient();

    // Fetch users with 'presenter' role
    const { data: presenters, error } = await supabase
        .from("profiles")
        .select(`
            id,
            full_name,
            username,
            slug,
            avatar_url,
            bio,
            is_live,
            presenter_meta (
                category,
                instagram_handle,
                twitter_handle
            )
        `)
        .eq("role", "presenter")
        .order("full_name");

    if (error) {
        console.error("Error fetching presenters:", error);
    }

    // Fetch liked IDs for the current user
    let likedPresenterIds: string[] = [];
    try {
        const likedData = await getUserLikedIds();
        likedPresenterIds = likedData.presenterIds;
    } catch (e) {
        // Fallback for unauthenticated or other errors
    }

    // Use dummy data if no real presenters exist or there's an error
    const displayPresenters = (presenters && presenters.length > 0) ? presenters : DUMMY_PRESENTERS;

    return (
        <div className="flex flex-col w-full min-h-screen bg-background">
            {/* Page Header */}
            <section className="py-12 md:py-16 text-center">
                <div className="container px-4 md:px-8 max-w-screen-2xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-foreground mb-3">
                        Meet the Pie Radio Team
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Your favorite voices, bringing you the best in music and entertainment
                    </p>
                </div>
            </section>

            {/* Presenters Content */}
            <section className="container pb-20 px-4 md:px-8 max-w-screen-2xl mx-auto">
                <PresentersClient
                    initialPresenters={displayPresenters as any}
                    executives={EXECUTIVES_DATA as any}
                    seniorLeadership={SENIOR_LEADERSHIP_DATA as any}
                    likedPresenterIds={likedPresenterIds}
                />
            </section>
        </div>
    );
}
