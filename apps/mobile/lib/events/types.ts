/**
 * Events — Shared Types (Mobile)
 */

export const EVENT_STATUSES = ['upcoming', 'past', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_CATEGORIES = [
  'general',
  'pop',
  'jazz',
  'electronic',
  'rock',
  'hiphop',
  'acoustic',
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  general: 'General',
  pop: 'Pop',
  jazz: 'Jazz',
  electronic: 'Electronic',
  rock: 'Rock',
  hiphop: 'Hip Hop',
  acoustic: 'Acoustic',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  cancelled: 'Cancelled',
};

export interface Event {
  id: string;
  title: string;
  description: string | null;
  artist_name: string | null;
  category: EventCategory;
  status: EventStatus;
  start_time: string;
  end_time: string | null;
  location: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  cover_image_url: string | null;
  price_min: number;
  price_max: number | null;
  currency: string;
  ticket_url: string | null;
  capacity: number | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export function formatEventPrice(event: Pick<Event, 'price_min' | 'price_max' | 'currency'>): string {
  const symbol = event.currency === 'GBP' ? '£' : event.currency;

  if (event.price_min === 0 && (!event.price_max || event.price_max === 0)) {
    return 'Free';
  }

  if (!event.price_max || event.price_max === event.price_min) {
    return `${symbol}${event.price_min}`;
  }

  return `${symbol}${event.price_min} – ${symbol}${event.price_max}`;
}
