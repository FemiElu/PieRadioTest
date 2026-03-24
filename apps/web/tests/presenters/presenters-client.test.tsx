import { render, screen } from "@testing-library/react";
import { PresentersClient } from "@/components/presenters/presenters-client";
import type { Presenter } from "@/components/presenters/presenter-grid";

const makePresenter = (overrides: Partial<Presenter> = {}): Presenter => ({
  id: "1",
  full_name: "Test Presenter",
  username: "test-presenter",
  slug: "test-presenter",
  avatar_url: null,
  bio: "A test presenter",
  is_live: false,
  presenter_meta: {
    category: "afrobeats",
    instagram_handle: null,
    twitter_handle: null,
  },
  shows: [],
  ...overrides,
});

describe("PresentersClient", () => {
  it("renders the main presenters heading and grid content", () => {
    const presenters = [makePresenter(), makePresenter({ id: "2", full_name: "Another Presenter" })];

    render(
      <PresentersClient
        initialPresenters={presenters}
        executives={[]}
        seniorLeadership={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /meet our presenters/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/test presenter/i),
    ).toBeInTheDocument();
  });

  it("shows 'On Air' badge when presenter is_live is true", () => {
    const livePresenter = makePresenter({ id: "live-1", full_name: "Live Presenter", is_live: true });

    render(
      <PresentersClient
        initialPresenters={[livePresenter]}
        executives={[]}
        seniorLeadership={[]}
      />,
    );

    // The badge text is "On Air" — rendered when presenter.is_live === true
    expect(screen.getByText(/on air/i)).toBeInTheDocument();
  });

  it("does not show 'On Air' badge when presenter is_live is false", () => {
    const offAirPresenter = makePresenter({ id: "off-1", full_name: "Off Air Presenter", is_live: false });

    render(
      <PresentersClient
        initialPresenters={[offAirPresenter]}
        executives={[]}
        seniorLeadership={[]}
      />,
    );

    expect(screen.queryByText(/on air/i)).not.toBeInTheDocument();
  });
});
