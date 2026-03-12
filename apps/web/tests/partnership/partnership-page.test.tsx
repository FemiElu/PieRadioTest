import { render } from "@testing-library/react";
import PartnershipPage from "@/app/partnership/page";

describe("PartnershipPage", () => {
  it("redirects to /popeyesuk", () => {
    expect(() => render(<PartnershipPage />)).toThrow(/NEXT_REDIRECT/i);
  });
});

