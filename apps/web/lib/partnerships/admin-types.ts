export type PartnershipStatus = "draft" | "published" | "archived";

export type PartnershipSummary = {
    id: string;
    slug: string;
    title: string;
    brand_name: string;
    status: PartnershipStatus;
    updated_at: string;
    thumbnail_url: string | null;
    publish_issues: string[];
    content_valid: boolean;
};

export type PartnershipWorkspaceResponse = {
    pages: PartnershipSummary[];
    meta: {
        page: number;
        pageSize: 3;
        total: number;
        totalPages: number;
        counts: Record<PartnershipStatus, number>;
    };
    cleanup: { pending: number; available: boolean };
};

export type PartnershipActionResult = {
    id: string;
    status: "published" | "deleted" | "cleanup_pending" | "blocked" | "conflict" | "not_found" | "failed";
    message?: string;
    issues?: string[];
    updated_at?: string;
};
