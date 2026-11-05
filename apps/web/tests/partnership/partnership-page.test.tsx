import PartnershipPage from "@/app/partnership/page";

describe("PartnershipPage", () => {
  it("redirects to /popeyesuk", () => {
    expect(() => PartnershipPage()).toThrow(/NEXT_REDIRECT/i);
  });
});

