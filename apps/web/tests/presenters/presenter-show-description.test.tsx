import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PresenterShowDescription } from "@/components/presenters/presenter-show-description";

describe("PresenterShowDescription", () => {
  it("renders the description text", () => {
    render(<PresenterShowDescription description="A short blurb." />);
    expect(screen.getByText("A short blurb.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /show more/i }),
    ).not.toBeInTheDocument();
  });

  it("shows Show more when truncated and toggles with Show less", async () => {
    const user = userEvent.setup();
    const scrollSpy = vi
      .spyOn(HTMLParagraphElement.prototype, "scrollHeight", "get")
      .mockImplementation(function (this: HTMLParagraphElement) {
        return this.textContent && this.textContent.length > 50 ? 120 : 36;
      });
    const clientSpy = vi
      .spyOn(HTMLParagraphElement.prototype, "clientHeight", "get")
      .mockReturnValue(36);

    try {
      render(
        <PresenterShowDescription
          description={"Word ".repeat(30).trim()}
        />,
      );

      const toggle = await screen.findByRole("button", { name: /show more/i });
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      await user.click(toggle);

      const showLess = screen.getByRole("button", { name: /show less/i });
      expect(showLess).toHaveAttribute("aria-expanded", "true");

      await user.click(showLess);

      expect(
        await screen.findByRole("button", { name: /show more/i }),
      ).toBeInTheDocument();
    } finally {
      scrollSpy.mockRestore();
      clientSpy.mockRestore();
    }
  });
});
