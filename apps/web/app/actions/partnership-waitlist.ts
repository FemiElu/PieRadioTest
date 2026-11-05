"use server";

import { createClient } from "@/lib/supabase/server";
import { getPartnershipBySlug } from "@/lib/partnerships/queries";
import { joinWaitlist } from "@/app/actions/waitlist";
import type { WaitlistState } from "@/app/actions/waitlist";

export type PartnershipWaitlistState = WaitlistState & { submittedEmail?: string };

export async function joinPartnershipWaitlist(
    slug: string,
    _previousState: PartnershipWaitlistState,
    formData: FormData,
): Promise<PartnershipWaitlistState> {
    const supabase = await createClient();
    const page = await getPartnershipBySlug(supabase, slug);
    if (!page) return { message: "This partnership waitlist is not available." };

    const submittedEmail = formData.get("email")?.toString().trim() ?? "";
    const safeFormData = new FormData();
    safeFormData.set("fullName", formData.get("fullName")?.toString() ?? "");
    safeFormData.set("email", submittedEmail);
    safeFormData.set("marketingConsent", formData.get("marketingConsent") === "true" ? "true" : "false");
    safeFormData.set("source", page.slug === "popeyesuk" ? "partnership_page" : `partnership:${page.slug}`);

    const result = await joinWaitlist(null, safeFormData);
    return { ...result, submittedEmail: result.success ? submittedEmail : undefined };
}
