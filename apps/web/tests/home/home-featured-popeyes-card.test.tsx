import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/context/audio-context", () => ({
  useAudio: () => ({
    isPlaying: false,
    togglePlay: vi.fn(),
    isLoading: false,
    currentTrack: null,
  }),
}));

vi.mock("@/hooks/use-current-show", () => ({
  useCurrentShow: () => ({ currentShow: null }),
}));

vi.mock("@/hooks/use-schedule", () => ({
  useSchedule: () => ({ schedule: [], loading: false }),
}));

describe("Home Page - Main Featured Popeyes Card", () => {
  it("links the main featured partnership card to /popeyesuk", () => {
    render(<Home />);

    const link = screen.getByRole("link", {
      name: /pie radio collabs with popeyes/i,
    });

    expect(link).toHaveAttribute("href", "/popeyesuk");
  });
});

