export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
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
                    title?: string
                }
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
            }
            music_requests: {
                Row: {
                    artist_name: string
                    created_at: string | null
                    dedicated_to: string | null
                    id: string
                    preferred_play_date: string | null
                    song_title: string
                    status: Database["public"]["Enums"]["request_status"] | null
                    user_id: string | null
                    requested_by_user_id: string | null
                    station_id: number | null
                    show_id: string | null
                    listener_note: string | null
                    device_id: string | null
                    rejection_reason: string | null
                    approved_at: string | null
                    played_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    artist_name: string
                    created_at?: string | null
                    dedicated_to?: string | null
                    id?: string
                    preferred_play_date?: string | null
                    song_title: string
                    status?: Database["public"]["Enums"]["request_status"] | null
                    user_id?: string | null
                    requested_by_user_id?: string | null
                    station_id?: number | null
                    show_id?: string | null
                    listener_note?: string | null
                    device_id?: string | null
                    rejection_reason?: string | null
                    approved_at?: string | null
                    played_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    artist_name?: string
                    created_at?: string | null
                    dedicated_to?: string | null
                    id?: string
                    preferred_play_date?: string | null
                    song_title?: string
                    status?: Database["public"]["Enums"]["request_status"] | null
                    user_id?: string | null
                    requested_by_user_id?: string | null
                    station_id?: number | null
                    show_id?: string | null
                    listener_note?: string | null
                    device_id?: string | null
                    rejection_reason?: string | null
                    approved_at?: string | null
                    played_at?: string | null
                    updated_at?: string | null
                }
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
            }
            presenter_meta: {
                Row: {
                    instagram_handle: string | null
                    joined_date: string | null
                    twitter_handle: string | null
                    user_id: string
                    website_url: string | null
                    category: string | null
                }
                Insert: {
                    instagram_handle?: string | null
                    joined_date?: string | null
                    twitter_handle?: string | null
                    user_id: string
                    website_url?: string | null
                    category?: string | null
                }
                Update: {
                    instagram_handle?: string | null
                    joined_date?: string | null
                    twitter_handle?: string | null
                    user_id?: string
                    website_url?: string | null
                    category?: string | null
                }
            }
            presenter_messages: {
                Row: {
                    id: string
                    presenter_id: string
                    sender_name: string
                    sender_email: string
                    message: string
                    is_read: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    presenter_id: string
                    sender_name: string
                    sender_email: string
                    message: string
                    is_read?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    presenter_id?: string
                    sender_name?: string
                    sender_email?: string
                    message?: string
                    is_read?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
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
                    role: Database["public"]["Enums"]["user_role"] | null
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
                    role?: Database["public"]["Enums"]["user_role"] | null
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
                    role?: Database["public"]["Enums"]["user_role"] | null
                    slug?: string | null
                    updated_at?: string | null
                    username?: string | null
                }
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
            }
            shows: {
                Row: {
                    cover_image_url: string | null
                    created_at: string | null
                    description: string | null
                    genre: string | null
                    host_id: string | null
                    id: string
                    is_featured: boolean | null
                    title: string
                }
                Insert: {
                    cover_image_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    genre?: string | null
                    host_id?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title: string
                }
                Update: {
                    cover_image_url?: string | null
                    created_at?: string | null
                    description?: string | null
                    genre?: string | null
                    host_id?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title?: string
                }
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
                    id?: number
                    title?: string | null
                    updated_at?: string | null
                }
                Update: {
                    artist?: string | null
                    cover_url?: string | null
                    id?: number
                    title?: string | null
                    updated_at?: string | null
                }
            }
            station_metadata_history: {
                Row: {
                    artist: string | null
                    cover_url: string | null
                    created_at: string | null
                    id: number
                    metadata_id: number | null
                    title: string | null
                }
                Insert: {
                    artist?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    id?: number
                    metadata_id?: number | null
                    title?: string | null
                }
                Update: {
                    artist?: string | null
                    cover_url?: string | null
                    created_at?: string | null
                    id?: number
                    metadata_id?: number | null
                    title?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_user_role: {
                Args: Record<string, never>
                Returns: string
            }
        }
        Enums: {
            request_status: "pending" | "approved" | "declined" | "played" | "rejected" | "expired"
            user_role: "listener" | "presenter" | "admin"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
