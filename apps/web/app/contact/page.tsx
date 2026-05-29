import type { Metadata } from "next";
import ContactClient from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us | Pie Radio",
  description:
    "Get in touch with Pie Radio. Reach out to hello@pieradio.co.uk or officialpieradio@gmail.com for general inquiries, feedback, programming questions, bookings, or advertising.",
  openGraph: {
    title: "Contact Us | Pie Radio",
    description: "Connect with the UK's number one station for the youth. Send us an email or follow us on our socials.",
    type: "website",
    url: "https://www.pieradio.co.uk/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
