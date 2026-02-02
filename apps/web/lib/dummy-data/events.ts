export type TicketTier = {
    id: string;
    name: string;
    price: number;
    currency: string;
    available: number;
    description?: string;
};

export type EventStatus = "onsale" | "soldout" | "fewleft" | "presale" | "cancelled";

export type Event = {
    id: string;
    title: string;
    artist: string;
    date: string; // ISO string
    time: string;
    venue: {
        name: string;
        address: string;
        city: string;
        mapUrl?: string; // Placeholder for map image
        capacity?: number;
        transportTips?: string;
        rules?: string[];
    };
    image: string; // URL
    category: "all" | "pop" | "jazz" | "electronic" | "rock" | "hiphop" | "acoustic";
    priceRange: {
        min: number;
        max: number;
        currency: string;
    };
    status: EventStatus;
    description: string;
    ticketTiers: TicketTier[];
    isFeatured?: boolean;
    audioPromoUrl?: string; // URL for 30-60s snippet
};

export const EVENTS: Event[] = [
    {
        id: "1",
        title: "Summer Music Festival 2026",
        artist: "Various Artists",
        date: "2026-06-15T14:00:00",
        time: "14:00",
        venue: {
            name: "Central Park Arena",
            address: "123 Park Ave, New York, NY",
            city: "New York",
            transportTips: "Subway lines A, C, B, D to 59th St.",
            rules: ["No outside food/drink", "Clear bag policy"],
        },
        image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        category: "pop",
        priceRange: { min: 45, max: 120, currency: "$" },
        status: "onsale",
        description: "The biggest summer festival returns with a star-studded lineup including...",
        isFeatured: true,
        ticketTiers: [
            { id: "t1", name: "General Admission", price: 45, currency: "$", available: 500, description: "Entry to all stages" },
            { id: "t2", name: "VIP", price: 120, currency: "$", available: 50, description: "Front row access + VIP lounge" },
        ],
        audioPromoUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    },
    {
        id: "2",
        title: "Jazz Night with The Legends",
        artist: "The Jazz Legends",
        date: "2026-02-10T20:00:00",
        time: "20:00",
        venue: {
            name: "Blue Note Club",
            address: "131 W 3rd St, New York, NY",
            city: "New York",
            transportTips: "Near West 4th St station.",
            rules: ["21+", "Dress code applied"],
        },
        image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        category: "jazz",
        priceRange: { min: 35, max: 60, currency: "$" },
        status: "fewleft",
        description: "An intimate evening with jazz greats performing classics and new improvisations.",
        isFeatured: true,
        ticketTiers: [
            { id: "t1", name: "Seated", price: 60, currency: "$", available: 12 },
            { id: "t2", name: "Standing", price: 35, currency: "$", available: 50 },
        ],
    },
    {
        id: "3",
        title: "Electronic Dreams Festival",
        artist: "DJ Nova & Friends",
        date: "2026-03-22T21:00:00",
        time: "21:00",
        venue: {
            name: "Warehouse District",
            address: "55 Water St, Brooklyn, NY",
            city: "Brooklyn",
            transportTips: "Ferry to DUMBO or A/C train to High St.",
        },
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        category: "electronic",
        priceRange: { min: 55, max: 95, currency: "$" },
        status: "onsale",
        description: "Immersive visuals and heart-pounding beats from top electronic artists.",
        isFeatured: true,
        ticketTiers: [
            { id: "t1", name: "Early Bird", price: 55, currency: "$", available: 0 },
            { id: "t2", name: "Regular", price: 75, currency: "$", available: 200 },
            { id: "t3", name: "Backstage Pass", price: 95, currency: "$", available: 20 },
        ],
    },
    {
        id: "4",
        title: "Indie Rock Showcase",
        artist: "The Wanderers",
        date: "2026-04-12T19:30:00",
        time: "19:30",
        venue: {
            name: "The Mercury Lounge",
            address: "217 E Houston St, New York, NY",
            city: "New York",
        },
        image: "https://images.unsplash.com/photo-1459749411177-0473ef71607b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        category: "rock",
        priceRange: { min: 25, max: 25, currency: "$" },
        status: "presale",
        description: "Catch the rising stars of the indie rock scene.",
        ticketTiers: [
            { id: "t1", name: "General Admission", price: 25, currency: "$", available: 100 },
        ],
    },
    {
        id: "5",
        title: "Hip Hop Flow Night",
        artist: "MC Rhythm",
        date: "2026-05-05T22:00:00",
        time: "22:00",
        venue: {
            name: "Brooklyn Steel",
            address: "319 Frost St, Brooklyn, NY",
            city: "Brooklyn",
        },
        image: "https://images.unsplash.com/photo-1571266028243-3716002dbc6e?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        category: "hiphop",
        priceRange: { min: 40, max: 80, currency: "$" },
        status: "soldout",
        description: "A night of lyrical mastery and heavy beats.",
        ticketTiers: [
            { id: "t1", name: "GA", price: 40, currency: "$", available: 0 },
        ],
    },
    {
        id: "6",
        title: "Acoustic Sunday Sessions",
        artist: "Sarah & John",
        date: "2026-02-15T11:00:00",
        time: "11:00",
        venue: {
            name: "The Coffee House",
            address: "789 Main St, Soho, NY",
            city: "New York",
        },
        image: "https://images.unsplash.com/photo-1510915361408-d59c5d0e985b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
        category: "acoustic",
        priceRange: { min: 15, max: 15, currency: "$" },
        status: "onsale",
        description: "Relaxing acoustic covers and originals to start your Sunday.",
        ticketTiers: [
            { id: "t1", name: "Entry", price: 15, currency: "$", available: 30 },
        ],
    },
];
