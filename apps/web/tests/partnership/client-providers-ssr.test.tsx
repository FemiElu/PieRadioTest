// @vitest-environment node
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ClientProviders } from "@/components/providers/client-providers";
import { useAudio } from "@/context/audio-context";

vi.mock("@/context/auth-context", () => ({ AuthProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/layout/header", () => ({ Header: () => null }));
vi.mock("@/components/layout/footer", () => ({ Footer: () => null }));
// Client-only widgets contribute no server HTML. The page must still render.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

function PageContent() {
    const { currentTrack } = useAudio();
    return <h1>Partnership editor: {currentTrack?.title}</h1>;
}

describe("initial page rendering", () => {
    it("includes page content and the audio context in server HTML without browser APIs", () => {
        const html = renderToString(<ClientProviders><PageContent /></ClientProviders>);
        expect(html).toContain("Partnership editor:");
        expect(html).toContain("Pie Radio Live");
    });
});
