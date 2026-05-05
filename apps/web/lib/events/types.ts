/**
 * Events — Shared Types
 *
 * Canonical type definitions for the Events feature.
 * Both admin and public UI consume these types.
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

/** Human-readable labels for categories (used in filter chips & admin form). */
export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  general: 'General',
  pop: 'Pop',
  jazz: 'Jazz',
  electronic: 'Electronic',
  rock: 'Rock',
  hiphop: 'Hip Hop',
  acoustic: 'Acoustic',
};

/** Human-readable labels for statuses. */
export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  cancelled: 'Cancelled',
};

/**
 * Event — maps 1:1 to the `public.events` table.
 *
 * All fields are snake_case to match the DB schema.
 */
export interface Event {
  id: string;
  title: string;
  description: string | null;
  artist_name: string | null;
  category: EventCategory;
  status: EventStatus;

  // Date & time
  start_time: string; // ISO 8601
  end_time: string | null;

  // Venue
  location: string | null; // legacy column, kept for compat
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;

  // Media
  cover_image_url: string | null;

  // Pricing & tickets
  price_min: number;
  price_max: number | null;
  currency: string; // default 'GBP'
  ticket_url: string | null;
  external_url: string | null;
  capacity: number | null;

  // Flags
  is_featured: boolean;

  // Audit
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Formatted price helper.
 *
 * Returns e.g. "Free", "£20", or "£20 – £50".
 */
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
