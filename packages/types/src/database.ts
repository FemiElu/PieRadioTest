export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            artist_uploads: {
                Row: {
                    artist_id: string | null
                    audio_url: string
                    created_at: string | null
                    genre: string | null
                    id: string
                    reviewed_by: string | null
                    status: Database["public"]["Enums"]["request_status"] | null
                    title: string
                }
                Insert: {
                    artist_id?: string | null
                    audio_url: string
                    created_at?: string | null
                    genre?: string | null
                    id?: string
                    reviewed_by?: string | null
                    status?: Database["public"]["Enums"]["request_status"] | null
                    title: string
                }
                Update: {
                    artist_id?: string | null
                    audio_url?: string
                    created_at?: string | null
                    genre?: string | null
                    id?: string
                    reviewed_by?: string | null
                    status?: Database["public"]["Enums"]["request_status"] | null
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "artist_uploads_artist_id_fkey"
                        columns: ["artist_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "artist_uploads_reviewed_by_fkey"
                        columns: ["reviewed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            chat_messages: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    is_hidden: boolean | null
                    room_id: string | null
                    user_id: string | null
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    is_hidden?: boolean | null
                    room_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    is_hidden?: boolean | null
                    room_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "chat_messages_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            episodes: {
                Row: {
                    created_at: string | null
                    description: string | null
                    duration_seconds: number | null
                    file_key: string | null
                    id: string
                    published_at: string | null
                    show_id: string | null
                    title: string
                    updated_at: string | null
                    vod_hls_url: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    duration_seconds?: number | null
                    file_key?: string | null
                    id?: string
                    published_at?: string | null
                    show_id?: string | null
                    title: string
                    updated_at?: string | null
                    vod_hls_url?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    duration_seconds?: number | null
                    file_key?: string | null
                    id?: string
                    published_at?: string | null
                    show_id?: string | null
                    title?: string
                    updated_at?: string | null
                    vod_hls_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "episodes_show_id_fkey"
                        columns: ["show_id"]
                        isOneToOne: false
                        referencedRelation: "shows"
                        referencedColumns: ["id"]
                    },
                ]
            }
            events: {
                Row: {
                    capacity: number | null
                    cover_image_url: string | null
                    created_at: string | null
                    currency: string | null
                    description: string | null
                    end_time: string | null
                    id: string
                    location: string | null
                    price_amount: number | null
                    start_time: string
                    title: string
                }
                Insert: {
                    capacity?: number | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    currency?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    location?: string | null
                    price_amount?: number | null
                    start_time: string
                    title: string
                }
                Update: {
                    capacity?: number | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    currency?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    location?: string | null
                    price_amount?: number | null
                    start_time?: string
                    title?: string
                }
                Relationships: []
            }
            favorites: {
                Row: {
                    created_at: string | null
                    id: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "favorites_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            music_requests: {
                Row: {
                    approved_at: string | null
                    artist_name: string
                    created_at: string | null
                    dedicated_to: string | null
                    device_id: string | null
                    id: string
                    listener_note: string | null
                    played_at: string | null
                    preferred_play_date: string | null
                    rejection_reason: string | null
                    requested_by_user_id: string | null
                    show_id: string | null
                    song_title: string
                    station_id: number | null
                    status: Database["public"]["Enums"]["request_status"] | null
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    approved_at?: string | null
                    artist_name: string
                    created_at?: string | null
                    dedicated_to?: string | null
                    device_id?: string | null
                    id?: string
                    listener_note?: string | null
                    played_at?: string | null
                    preferred_play_date?: string | null
                    rejection_reason?: string | null
                    requested_by_user_id?: string | null
                    show_id?: string | null
                    song_title: string
                    station_id?: number | null
                    status?: Database["public"]["Enums"]["request_status"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    approved_at?: string | null
                    artist_name?: string
                    created_at?: string | null
                    dedicated_to?: string | null
                    device_id?: string | null
                    id?: string
                    listener_note?: string | null
                    played_at?: string | null
                    preferred_play_date?: string | null
                    rejection_reason?: string | null
                    requested_by_user_id?: string | null
                    show_id?: string | null
                    song_title?: string
                    station_id?: number | null
                    status?: Database["public"]["Enums"]["request_status"] | null
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "music_requests_requested_by_user_id_fkey"
                        columns: ["requested_by_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "music_requests_show_id_fkey"
                        columns: ["show_id"]
                        isOneToOne: false
                        referencedRelation: "shows"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "music_requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            news_articles: {
                Row: {
                    author_id: string | null
                    content: string
                    cover_image_url: string | null
                    created_at: string | null
                    id: string
                    published_at: string | null
                    slug: string
                    title: string
                }
                Insert: {
                    author_id?: string | null
                    content: string
                    cover_image_url?: string | null
                    created_at?: string | null
                    id?: string
                    published_at?: string | null
                    slug: string
                    title: string
                }
                Update: {
                    author_id?: string | null
                    content?: string
                    cover_image_url?: string | null
                    created_at?: string | null
                    id?: string
                    published_at?: string | null
                    slug?: string
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "news_articles_author_id_fkey"
                        columns: ["author_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            playback_events: {
                Row: {
                    client: string | null
                    created_at: string | null
                    duration_seconds: number | null
                    episode_id: string | null
                    event_type: string
                    id: string
                    position_seconds: number | null
                    station_id: string | null
                    user_id: string | null
                }
                Insert: {
                    client?: string | null
                    created_at?: string | null
                    duration_seconds?: number | null
                    episode_id?: string | null
                    event_type: string
                    id?: string
                    position_seconds?: number | null
                    station_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    client?: string | null
                    created_at?: string | null
                    duration_seconds?: number | null
                    episode_id?: string | null
                    event_type?: string
                    id?: string
                    position_seconds?: number | null
                    station_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "playback_events_station_id_fkey"
                        columns: ["station_id"]
                        isOneToOne: false
                        referencedRelation: "station"
                        referencedColumns: ["id"]
                    },
                ]
            }
            presenter_messages: {
                Row: {
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    message: string
                    presenter_id: string
                    sender_email: string
                    sender_name: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message: string
                    presenter_id: string
                    sender_email: string
                    sender_name: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    message?: string
                    presenter_id?: string
                    sender_email?: string
                    sender_name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "presenter_messages_presenter_id_fkey"
                        columns: ["presenter_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            presenter_meta: {
                Row: {
                    category: string | null
                    instagram_handle: string | null
                    joined_date: string | null
                    twitter_handle: string | null
                    user_id: string
                    website_url: string | null
                }
                Insert: {
                    category?: string | null
                    instagram_handle?: string | null
                    joined_date?: string | null
                    twitter_handle?: string | null
                    user_id: string
                    website_url?: string | null
                }
                Update: {
                    category?: string | null
                    instagram_handle?: string | null
                    joined_date?: string | null
                    twitter_handle?: string | null
                    user_id?: string
                    website_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "presenter_meta_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    is_live: boolean | null
                    role: string
                    slug: string | null
                    updated_at: string | null
                    username: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    is_live?: boolean | null
                    role?: string
                    slug?: string | null
                    updated_at?: string | null
                    username?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    is_live?: boolean | null
                    role?: string
                    slug?: string | null
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: []
            }
            role_change_audit: {
                Row: {
                    changed_at: string
                    changed_by: string | null
                    id: string
                    ip_address: unknown
                    new_role: string
                    old_role: string | null
                    reason: string | null
                    user_agent: string | null
                    user_id: string
                }
                Insert: {
                    changed_at?: string
                    changed_by?: string | null
                    id?: string
                    ip_address?: unknown
                    new_role: string
                    old_role?: string | null
                    reason?: string | null
                    user_agent?: string | null
                    user_id: string
                }
                Update: {
                    changed_at?: string
                    changed_by?: string | null
                    id?: string
                    ip_address?: unknown
                    new_role?: string
                    old_role?: string | null
                    reason?: string | null
                    user_agent?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "role_change_audit_changed_by_fkey"
                        columns: ["changed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "role_change_audit_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            schedule_entries: {
                Row: {
                    created_at: string | null
                    description: string | null
                    end_time: string | null
                    id: string
                    show_id: string | null
                    start_time: string
                    title: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    show_id?: string | null
                    start_time: string
                    title?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    end_time?: string | null
                    id?: string
                    show_id?: string | null
                    start_time?: string
                    title?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "schedule_entries_show_id_fkey"
                        columns: ["show_id"]
                        isOneToOne: false
                        referencedRelation: "shows"
                        referencedColumns: ["id"]
                    },
                ]
            }
            schedule_slots: {
                Row: {
                    created_at: string | null
                    day_of_week: number | null
                    end_time: string
                    id: string
                    is_recurring: boolean | null
                    override_date: string | null
                    show_id: string | null
                    start_time: string
                }
                Insert: {
                    created_at?: string | null
                    day_of_week?: number | null
                    end_time: string
                    id?: string
                    is_recurring?: boolean | null
                    override_date?: string | null
                    show_id?: string | null
                    start_time: string
                }
                Update: {
                    created_at?: string | null
                    day_of_week?: number | null
                    end_time?: string
                    id?: string
                    is_recurring?: boolean | null
                    override_date?: string | null
                    show_id?: string | null
                    start_time?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "schedule_slots_show_id_fkey"
                        columns: ["show_id"]
                        isOneToOne: false
                        referencedRelation: "shows"
                        referencedColumns: ["id"]
                    },
                ]
            }
            schedules: {
                Row: {
                    created_at: string | null
                    description: string | null
                    end_time: string
                    id: string
                    image_url: string | null
                    is_live: boolean | null
                    presenter_id: string | null
                    start_time: string
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    end_time: string
                    id?: string
                    image_url?: string | null
                    is_live?: boolean | null
                    presenter_id?: string | null
                    start_time: string
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    end_time?: string
                    id?: string
                    image_url?: string | null
                    is_live?: boolean | null
                    presenter_id?: string | null
                    start_time?: string
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "schedules_presenter_id_fkey"
                        columns: ["presenter_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            shows: {
                Row: {
                    artwork_url: string | null
                    created_at: string | null
                    description: string | null
                    genre: string | null
                    host_id: string | null
                    id: string
                    is_featured: boolean | null
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    artwork_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    genre?: string | null
                    host_id?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    artwork_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    genre?: string | null
                    host_id?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "shows_host_id_fkey"
                        columns: ["host_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            station: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    slug: string
                    stream_hls_url: string | null
                    stream_icy_url: string | null
                    timezone: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    slug: string
                    stream_hls_url?: string | null
                    stream_icy_url?: string | null
                    timezone?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    slug?: string
                    stream_hls_url?: string | null
                    stream_icy_url?: string | null
                    timezone?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            station_metadata: {
                Row: {
                    artist: string | null
                    cover_url: string | null
                    id: number
                    title: string | null
                    updated_at: string | null
                }
                Insert: {
                    artist?: string | null
                    cover_url?: string | null
                    id?: never
                    title?: string | null
                    updated_at?: string | null
                }
                Update: {
                    artist?: string | null
                    cover_url?: string | null
                    id?: never
                    title?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            station_metadata_history: {
                Row: {
                    artist: string | null
                    cover_url: string | null
                    id: string
                    metadata_id: number | null
                    played_at: string | null
                    title: string | null
                }
                Insert: {
                    artist?: string | null
                    cover_url?: string | null
                    id?: string
                    metadata_id?: number | null
                    played_at?: string | null
                    title?: string | null
                }
                Update: {
                    artist?: string | null
                    cover_url?: string | null
                    id?: string
                    metadata_id?: number | null
                    played_at?: string | null
                    title?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "station_metadata_history_metadata_id_fkey"
                        columns: ["metadata_id"]
                        isOneToOne: false
                        referencedRelation: "station_metadata"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tickets: {
                Row: {
                    event_id: string | null
                    id: string
                    purchased_at: string | null
                    qr_code: string | null
                    status: string | null
                    stripe_session_id: string | null
                    user_id: string | null
                }
                Insert: {
                    event_id?: string | null
                    id?: string
                    purchased_at?: string | null
                    qr_code?: string | null
                    status?: string | null
                    stripe_session_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    event_id?: string | null
                    id?: string
                    purchased_at?: string | null
                    qr_code?: string | null
                    status?: string | null
                    stripe_session_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tickets_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tickets_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            uploads: {
                Row: {
                    created_at: string | null
                    error: string | null
                    file_key: string | null
                    id: string
                    original_filename: string | null
                    purpose: string | null
                    status: string | null
                    updated_at: string | null
                    uploaded_by: string | null
                }
                Insert: {
                    created_at?: string | null
                    error?: string | null
                    file_key?: string | null
                    id?: string
                    original_filename?: string | null
                    purpose?: string | null
                    status?: string | null
                    updated_at?: string | null
                    uploaded_by?: string | null
                }
                Update: {
                    created_at?: string | null
                    error?: string | null
                    file_key?: string | null
                    id?: string
                    original_filename?: string | null
                    purpose?: string | null
                    status?: string | null
                    updated_at?: string | null
                    uploaded_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "uploads_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_favorites: {
                Row: {
                    created_at: string | null
                    id: string
                    item_id: string
                    item_type: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    item_id: string
                    item_type?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    item_id?: string
                    item_type?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_favorites_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            waitlist: {
                Row: {
                    created_at: string | null
                    email: string
                    full_name: string
                    id: string
                    source: string | null
                }
                Insert: {
                    created_at?: string | null
                    email: string
                    full_name: string
                    id?: string
                    source?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string
                    full_name?: string
                    id?: string
                    source?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            role_change_audit_view: {
                Row: {
                    changed_at: string | null
                    changed_by: string | null
                    changed_by_name: string | null
                    id: string | null
                    new_role: string | null
                    old_role: string | null
                    reason: string | null
                    user_email: string | null
                    user_full_name: string | null
                    user_id: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "role_change_audit_changed_by_fkey"
                        columns: ["changed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "role_change_audit_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Functions: {
            current_user_role: { Args: never; Returns: string }
            get_user_role: { Args: never; Returns: string }
            has_any_role: { Args: { required_roles: string[] }; Returns: boolean }
            has_role: { Args: { required_role: string }; Returns: boolean }
            is_admin: { Args: never; Returns: boolean }
            is_presenter: { Args: never; Returns: boolean }
            is_presenter_or_admin: { Args: never; Returns: boolean }
        }
        Enums: {
            request_status:
            | "pending"
            | "approved"
            | "declined"
            | "played"
            | "rejected"
            | "expired"
            user_role: "listener" | "presenter" | "admin"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            request_status: [
                "pending",
                "approved",
                "declined",
                "played",
                "rejected",
                "expired",
            ],
            user_role: ["listener", "presenter", "admin"],
        },
    },
} as const
