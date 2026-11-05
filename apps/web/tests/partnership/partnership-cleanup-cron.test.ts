// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/cron/sync-schedule/route";

const jobs = vi.hoisted(() => ({ cleanup: vi.fn(), csv: vi.fn(), createClient: vi.fn() }));
vi.mock("@/lib/partnerships/cleanup", () => ({ runPartnershipCleanup: jobs.cleanup }));
vi.mock("@supabase/supabase-js", () => ({ createClient: jobs.createClient }));
vi.mock("axios", () => ({ default: { get: jobs.csv } }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("CRON_SECRET", "test-cron-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
    jobs.createClient.mockReturnValue({});
    jobs.cleanup.mockResolvedValue({ completed: 1, pending: 0 });
    jobs.csv.mockRejectedValue(new Error("CSV temporarily unavailable"));
});
afterEach(() => vi.unstubAllEnvs());

describe("scheduled partnership cleanup", () => {
    it("runs even when the schedule CSV fetch fails", async () => {
        const response = await GET(new Request("http://localhost/api/cron/sync-schedule", { headers: { authorization: "Bearer test-cron-secret" } }));
        expect(response.status).toBe(500);
        expect(jobs.cleanup).toHaveBeenCalledExactlyOnceWith({}, { limit: 3 });
    });

    it("does not start cleanup for unauthorized cron requests", async () => {
        const response = await GET(new Request("http://localhost/api/cron/sync-schedule"));
        expect(response.status).toBe(401);
        expect(jobs.cleanup).not.toHaveBeenCalled();
    });

    it("does not extend the legacy development bypass to service-role media deletion", async () => {
        vi.stubEnv("NODE_ENV", "development");
        const response = await GET(new Request("http://localhost/api/cron/sync-schedule"));
        expect(response.status).toBe(500); // Existing dev schedule sync still attempts its CSV fetch.
        expect(jobs.cleanup).not.toHaveBeenCalled();
    });
});
