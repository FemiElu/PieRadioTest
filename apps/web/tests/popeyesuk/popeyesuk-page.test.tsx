import { render, screen } from "@testing-library/react";
import PartnershipPage from "@/app/popeyesuk/page";

describe("PopeyesUkPage", () => {
  it("renders hero and waitlist headings", () => {
    render(<PartnershipPage />);

    expect(
      screen.getByRole("heading", {
        name: /turning up the flavor\. turning up the volume\./i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /join the waitlist/i,
      }),
    ).toBeInTheDocument();
  });
});


