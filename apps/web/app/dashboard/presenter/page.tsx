import { PresenterMessagesList } from "@/components/presenters/messages-list";
import { getPresenterMessages } from "@/actions/presenter-messages";
import { DashboardClient } from "./client";

/**
 * Presenter Dashboard Page (Server Component)
 */
export default async function PresenterDashboard() {
    // Fetch messages on the server
    const { success, data: messages } = await getPresenterMessages();

    // If fetch fails or user is not authorized, we just show empty list
    // The DashboardClient will handle the rest of the UI
    const initialMessages = success && messages ? messages : [];

    return <DashboardClient initialMessages={initialMessages} />;
}
