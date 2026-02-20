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
                    created_at: string
                    id: string
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string
                    id?: string
                    user_id?: string
                }
                Update: {
                    content?: string
                    created_at?: string
                    id?: string
                    user_id?: string
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
            feature_flags: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    value: boolean
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    value?: boolean
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    value?: boolean
                }
                Relationships: []
            }
            music_requests: {
                Row: {
                    id: string
                    user_id: string | null
                    artist_name: string
                    song_title: string
                    preferred_play_date: string | null
                    status: Database["public"]["Enums"]["request_status"] | null
                    dedicated_to: string | null
                    created_at: string | null
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
                    id?: string
                    user_id?: string | null
                    artist_name: string
                    song_title: string
                    preferred_play_date?: string | null
                    status?: Database["public"]["Enums"]["request_status"] | null
                    dedicated_to?: string | null
                    created_at?: string | null
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
                    id?: string
                    user_id?: string | null
                    artist_name?: string
                    song_title?: string
                    preferred_play_date?: string | null
                    status?: Database["public"]["Enums"]["request_status"] | null
                    dedicated_to?: string | null
                    created_at?: string | null
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
                    id: string
                    instagram_handle: string | null
                    twitter_handle: string | null
                }
                Insert: {
                    category?: string | null
                    id: string
                    instagram_handle?: string | null
                    twitter_handle?: string | null
                }
                Update: {
                    category?: string | null
                    id?: string
                    instagram_handle?: string | null
                    twitter_handle?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "presenter_meta_id_fkey"
                        columns: ["id"]
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
                    role: Database["public"]["Enums"]["user_role"]
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
                    role?: Database["public"]["Enums"]["user_role"]
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
                    role?: Database["public"]["Enums"]["user_role"]
                    slug?: string | null
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: []
            }
            requests: {
                Row: {
                    artist: string
                    created_at: string
                    id: string
                    presenter_id: string | null
                    show_id: string | null
                    song_title: string
                    status: Database["public"]["Enums"]["request_status"] | null
                    user_id: string | null
                }
                Insert: {
                    artist: string
                    created_at?: string
                    id?: string
                    presenter_id?: string | null
                    show_id?: string | null
                    song_title: string
                    status?: Database["public"]["Enums"]["request_status"] | null
                    user_id?: string | null
                }
                Update: {
                    artist?: string
                    created_at?: string
                    id?: string
                    presenter_id?: string | null
                    show_id?: string | null
                    song_title?: string
                    status?: Database["public"]["Enums"]["request_status"] | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "requests_presenter_id_fkey"
                        columns: ["presenter_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "requests_show_id_fkey"
                        columns: ["show_id"]
                        isOneToOne: false
                        referencedRelation: "shows"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            role_change_audit: {
                Row: {
                    changed_at: string
                    changed_by: string | null
                    id: string
                    ip_address: string | null
                    new_role: string
                    old_role: string
                    reason: string | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    changed_at?: string
                    changed_by?: string | null
                    id?: string
                    ip_address?: string | null
                    new_role: string
                    old_role: string
                    reason?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    changed_at?: string
                    changed_by?: string | null
                    id?: string
                    ip_address?: string | null
                    new_role?: string
                    old_role?: string
                    reason?: string | null
                    user_agent?: string | null
                    user_id?: string | null
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
            schedules: {
                Row: {
                    created_at: string
                    description: string | null
                    end_time: string
                    id: string
                    image_url: string | null
                    is_live: boolean
                    presenter_id: string | null
                    start_time: string
                    title: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    end_time: string
                    id?: string
                    image_url?: string | null
                    is_live?: boolean
                    presenter_id?: string | null
                    start_time: string
                    title: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    end_time?: string
                    id?: string
                    image_url?: string | null
                    is_live?: boolean
                    presenter_id?: string | null
                    start_time?: string
                    title?: string
                    updated_at?: string
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
            schedule_slots: {
                Row: {
                    created_at: string | null
                    day_of_week: number
                    end_time: string
                    id: string
                    show_id: string
                    start_time: string
                }
                Insert: {
                    created_at?: string | null
                    day_of_week: number
                    end_time: string
                    id?: string
                    show_id: string
                    start_time: string
                }
                Update: {
                    created_at?: string | null
                    day_of_week?: number
                    end_time?: string
                    id?: string
                    show_id?: string
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
            shows: {
                Row: {
                    cover_image_url: string | null
                    created_at: string
                    description: string | null
                    host_id: string | null
                    id: string
                    is_featured: boolean | null
                    title: string
                    updated_at: string
                }
                Insert: {
                    cover_image_url?: string | null
                    created_at?: string
                    description?: string | null
                    host_id?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title: string
                    updated_at?: string
                }
                Update: {
                    cover_image_url?: string | null
                    created_at?: string
                    description?: string | null
                    host_id?: string | null
                    id?: string
                    is_featured?: boolean | null
                    title?: string
                    updated_at?: string
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
            station_metadata: {
                Row: {
                    id: number
                    title: string | null
                    artist: string | null
                    cover_url: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    title?: string | null
                    artist?: string | null
                    cover_url?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: number
                    title?: string | null
                    artist?: string | null
                    cover_url?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            tickets: {
                Row: {
                    created_at: string
                    description: string
                    id: string
                    priority: string
                    status: string
                    title: string
                    updated_at: string
                    user_id: string | null
                }
                Insert: {
                    created_at?: string
                    description: string
                    id?: string
                    priority?: string
                    status?: string
                    title: string
                    updated_at?: string
                    user_id?: string | null
                }
                Update: {
                    created_at?: string
                    description?: string
                    id?: string
                    priority?: string
                    status?: string
                    title?: string
                    updated_at?: string
                    user_id?: string | null
                }
                Relationships: [
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
                    filename: string
                    id: string
                    path: string
                    size: number
                    type: string
                    uploaded_at: string
                    uploaded_by: string | null
                }
                Insert: {
                    filename: string
                    id?: string
                    path: string
                    size: number
                    type: string
                    uploaded_at?: string
                    uploaded_by?: string | null
                }
                Update: {
                    filename?: string
                    id?: string
                    path?: string
                    size?: number
                    type?: string
                    uploaded_at?: string
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
                    created_at: string
                    id: string
                    item_id: string
                    item_type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    item_id: string
                    item_type: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    item_id?: string
                    item_type?: string
                    user_id?: string
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
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            is_admin_or_presenter: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
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

type PublicSchemaName = Extract<keyof Database, "public">
type PublicSchema = Database[PublicSchemaName]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: PublicSchemaName },
    TableName extends PublicTableNameOrOptions extends { schema: PublicSchemaName }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: PublicSchemaName }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: PublicSchemaName },
    TableName extends PublicTableNameOrOptions extends { schema: PublicSchemaName }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: PublicSchemaName }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: PublicSchemaName },
    TableName extends PublicTableNameOrOptions extends { schema: PublicSchemaName }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: PublicSchemaName }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: PublicSchemaName },
    EnumName extends PublicEnumNameOrOptions extends { schema: PublicSchemaName }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: PublicSchemaName }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: PublicSchemaName },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: PublicSchemaName
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: PublicSchemaName }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
