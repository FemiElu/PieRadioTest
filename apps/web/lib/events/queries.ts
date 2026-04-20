/**
 * Events — Supabase Query Functions
 *
 * Reusable data-access layer consumed by both API routes and
 * Server Components.  Every function accepts a Supabase client
 * so it works with both the server and client instances.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Event, EventCategory, EventStatus } from './types';

// ─── Column selector (single source of truth) ──────────────────────────
const EVENT_COLUMNS = `
  id, title, description, artist_name, category, status,
  start_time, end_time,
  location, venue_name, venue_address, venue_city,
  cover_image_url,
  price_min, price_max, currency, ticket_url, capacity,
  is_featured, created_by, created_at, updated_at
` as const;

// ─── Public Queries ─────────────────────────────────────────────────────

export interface PublicEventFilters {
  category?: EventCategory | 'all';
  search?: string | null;
  sort?: 'date_asc' | 'date_desc' | 'price_asc' | 'popular' | 'recommended';
  page?: number;
  limit?: number;
}

/**
 * Fetch publicly visible events (upcoming only by default).
 */
export async function getPublicEvents(
  supabase: SupabaseClient,
  filters: PublicEventFilters = {},
) {
  const {
    category = 'all',
    search = null,
    sort = 'date_asc',
    page = 1,
    limit = 20,
  } = filters;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('events')
    .select(EVENT_COLUMNS, { count: 'exact' })
    .eq('status', 'upcoming');

  // Category filter
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  // Full-text search across title, artist, venue
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,artist_name.ilike.%${search}%,venue_name.ilike.%${search}%,venue_city.ilike.%${search}%`,
    );
  }

  // Sorting
  switch (sort) {
    case 'date_asc':
      query = query.order('start_time', { ascending: true });
      break;
    case 'date_desc':
      query = query.order('start_time', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price_min', { ascending: true });
      break;
    case 'popular':
    case 'recommended':
    default:
      // Default: soonest first, featured prioritised
      query = query
        .order('is_featured', { ascending: false })
        .order('start_time', { ascending: true });
      break;
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getPublicEvents] Query error:', error.message);
    throw error;
  }

  return {
    events: (data ?? []) as Event[],
    total: count ?? 0,
  };
}

/**
 * Fetch featured events for the carousel.
 */
export async function getFeaturedEvents(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('is_featured', true)
    .eq('status', 'upcoming')
    .order('start_time', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[getFeaturedEvents] Query error:', error.message);
    throw error;
  }

  return (data ?? []) as Event[];
}

/**
 * Fetch a single event by ID.
 */
export async function getEventById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('[getEventById] Query error:', error.message);
    throw error;
  }

  return data as Event;
}

/**
 * Fetch related events — same category or same city, excluding current.
 */
export async function getRelatedEvents(
  supabase: SupabaseClient,
  eventId: string,
  category: string,
  city: string | null,
  limit = 5,
) {
  const orFilter = city
    ? `category.eq.${category},venue_city.eq.${city}`
    : `category.eq.${category}`;

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_COLUMNS)
    .neq('id', eventId)
    .eq('status', 'upcoming')
    .or(orFilter)
    .order('start_time', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[getRelatedEvents] Query error:', error.message);
    return [];
  }

  return (data ?? []) as Event[];
}

// ─── Admin Queries ──────────────────────────────────────────────────────

export interface AdminEventFilters {
  status?: EventStatus | 'all';
  search?: string | null;
  page?: number;
  limit?: number;
}

/**
 * Fetch all events for the admin listing (any status).
 */
export async function getAllEventsAdmin(
  supabase: SupabaseClient,
  filters: AdminEventFilters = {},
) {
  const {
    status = 'all',
    search = null,
    page = 1,
    limit = 20,
  } = filters;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('events')
    .select(EVENT_COLUMNS, { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,artist_name.ilike.%${search}%,venue_name.ilike.%${search}%`,
    );
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('[getAllEventsAdmin] Query error:', error.message);
    throw error;
  }

  return {
    events: (data ?? []) as Event[],
    total: count ?? 0,
  };
}
