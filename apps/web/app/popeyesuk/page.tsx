"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Play,
  Music,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  MapPin,
  Calendar,
  Ticket,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "../actions/waitlist";
import { useFormStatus } from "react-dom";

const CAROUSEL_IMAGES = [
  {
    id: 1,
    src: "/assets/PopeyesBirminghamNewSt_mediumres_38.webp",
    alt: "man eating burger",
  },
  {
    id: 2,
    src: "/assets/popeyes_18102023_social-26.webp",
    alt: "burger close-up",
  },
  {
    id: 3,
    src: "/assets/popeyes_manchester_0001.webp",
    alt: "Popeyes exterior",
  },
  { id: 4, src: "/assets/popeye-3.jpeg", alt: "Delicious food" },
] as const;

const CONFETTI_COLORS = [
  "#FF6A00",
  "#A31919",
  "#FFB347",
  "#FF6B6B",
  "#FFC300",
  "#334AFF",
];

const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 40}%`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: `${Math.random() * 0.6}s`,
  rotation: `${Math.random() * 360}deg`,
  size: `${6 + Math.random() * 8}px`,
}));

const waitlistSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
});

function pushEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    const win = window as unknown as { dataLayer?: Record<string, unknown>[] };
    if (!win.dataLayer) {
      win.dataLayer = [];
    }
    win.dataLayer.push({ event, ...data });
  }
}



function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {CONFETTI_PIECES.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            top: p.top,
            backgroundColor: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotation})`,
          }}
        />
      ))}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      id="waitlist-submit"
      type="submit"
      disabled={pending}
      className="w-full h-12 rounded-xl text-base font-bold bg-popeyes-orange hover:bg-popeyes-orange/90 text-white shadow-lg shadow-popeyes-orange/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          Joining...
        </div>
      ) : (
        "Join the Waitlist"
      )}
    </Button>
  );
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);




  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.12 },
    );

    const targets = el.querySelectorAll(".scroll-reveal");
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, []);

  return ref;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function PopeyesUkPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const revealContainerRef = useScrollReveal();
  const waitlistRef = useRef<HTMLElement>(null);

  useEffect(() => {
    pushEvent("partnership_page_view");
  }, []);

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    pushEvent("carousel_scroll", { direction });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Marketing consent is now optional as requested.


    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const nameVal = formData.get("fullName")?.toString() || "";
    const emailVal = formData.get("email")?.toString() || "";

    const result = waitlistSchema.safeParse({
      fullName: nameVal,
      email: emailVal,
    });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0];
      setFormError(firstError || "Invalid input.");
      return;
    }

    try {
      // Append marketing consent to formData
      formData.append("marketingConsent", agreeToMarketing.toString());

      const response = await joinWaitlist(null, formData);

      if (response.success) {
        setFormSuccess(true);
        setShowConfetti(true);
        // Reset local state
        setAgreeToMarketing(false);
        setEmail("");
        setFullName("");

        pushEvent("waitlist_signup", { email: result.data.email });
        setTimeout(() => setShowConfetti(false), 2000);
      } else {
        setFormError(
          response.message || "Something went wrong. Please try again.",
        );
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    }
  };

  const handleSocialClick = useCallback((platform: string) => {
    pushEvent("social_click", { platform });
  }, []);

  const scrollToWaitlist = useCallback(() => {
    waitlistRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div ref={revealContainerRef} className="flex flex-col w-full">
      <Confetti show={showConfetti} />

      <section className="relative w-full min-h-[360px] sm:min-h-[420px] lg:min-h-[540px] xl:min-h-[640px] overflow-hidden bg-deep-text">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/popeyes_heroImg.webp"
            alt="Restaurant interior with warm lighting"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        <div className="container relative z-10 h-full max-w-screen-2xl mx-auto px-4 md:px-8 flex flex-col justify-center py-16 sm:py-20 lg:py-24">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Image
              src="/assets/logo.png"
              alt="Pie Radio logo"
              width={140}
              height={42}
              className="h-8 sm:h-10 lg:h-12 w-auto"
              priority
            />
            <span
              className="flex items-center justify-center text-white/50 text-2xl sm:text-3xl font-bold ml-2"
              style={{
                height: "max(3rem, 100%)",
                minHeight: "2.5rem",
                lineHeight: 1,
              }}
            >
              ×
            </span>
            <Image
              src="/assets/popeyeUse.png"
              alt="Popeyes Louisiana Kitchen logo"
              width={140}
              height={60}
              className="h-[73px] sm:h-[55px] lg:h-[73px] w-auto"
              quality={100}
              priority
            />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-display tracking-tight text-white leading-[1.08] max-w-3xl mb-4 sm:mb-6">
            Turning Up the Flavor.{" "}
            <span className="gradient-text">Turning Up the Volume.</span>
          </h1>

          <div className="max-w-2xl mb-6 sm:mb-8">
            <div className="space-y-4 text-sm sm:text-base lg:text-lg text-zinc-300 leading-relaxed">
              <p>
                Pie Radio has teamed up with Popeyes® UK, the global home of
                bold New Orleans flavour. Together, we&apos;re bringing the
                energy of music, culture and community to a series of upcoming
                store openings.
              </p>

              <p>
                Our DJs, presenters and special guests will be supplying the
                soundtrack - including the highly anticipated Wilmslow Road
                launch featuring Saoirse Marie and DJ G2. (Line-ups subject to
                change. More details coming soon.) Expect live broadcasts and
                big energy as Popeyes® brings its bold flavour to launch day.
              </p>

              <div className="space-y-2 pt-2">
                <p className="text-popeyes-orange md:text-lg sm:text-sm font-bold uppercase tracking-[0.2em]">
                  The Source Radio Show - Powered by Popeyes® UK{" "}
                </p>
                <p>
                  Launching{" "}
                  <span className="font-bold">
                    Tuesday 14 April - Tuesday 26 May
                  </span>
                </p>
                <p>
                  A brand-new weekly show exploring the sounds, culture and
                  influence of New Orleans - and its connection to Manchester.
                </p>
                <p>
                  Every <span className="font-bold">Tuesday | 5 - 6PM</span>{" "}
                  with{" "}
                  <span className="font-bold">DJ G.A.S.K.I.N & ELISHA</span>
                </p>

                <div className="pt-2">
                  <p>Expect:</p>
                  <ul className="list-disc pl-5 space-y-1 marker:text-popeyes-orange/90">
                    <li>Guest DJs & presenters</li>
                    <li>Cultural deep dives</li>
                    <li>Weekly giveaways</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p>
                  We&apos;re closing the series in style with a live celebration
                  in Manchester (date and location TBA) featuring Manchester
                  artists, DJs, special guests, limited-edition Popeyes® UK and
                  merch.
                </p>
              </div>
              <p>Capacity is limited - sign up now 🎶🍗</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              id="hero-cta-waitlist"
              size="lg"
              className="h-12 sm:h-14 px-8 rounded-full text-base sm:text-lg shadow-2xl shadow-popeyes-orange/30 gap-3 group bg-popeyes-orange hover:bg-popeyes-orange/90 text-white font-bold"
              onClick={scrollToWaitlist}
            >
              Join the Waitlist
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Link href="press" className="inline-flex">
              <Button
                id="hero-cta-press-release"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-full text-base sm:text-lg border-2 gap-3 bg-white/5 backdrop-blur-sm text-white border-white/20 hover:bg-white/10 hover:border-white/40 transition-all font-bold"
              >
                <Newspaper className="w-5 h-5 text-popeyes-orange" />
                See Press Release
              </Button>
            </Link>

            <div className="coming-soon-tooltip hidden lg:inline-flex">
              <Button
                id="hero-cta-preview"
                variant="outline"
                size="lg"
                className="h-12 sm:h-14 px-8 rounded-full text-base sm:text-lg border-2 gap-3 bg-white/5 backdrop-blur-sm text-white border-white/20 cursor-not-allowed opacity-60"
                disabled
                aria-disabled="true"
                title="Available on launch."
              >
                <Music className="w-5 h-5" />
                Preview Heaters Show
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-deep-text py-16 sm:py-20 lg:py-24 overflow-hidden">
        <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="flex items-end justify-between mb-8 sm:mb-10 scroll-reveal">
            <div>
              <p className="text-popeyes-orange text-xs sm:text-sm font-bold uppercase tracking-[0.2em] mb-2">
                Sneak Peek
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight">
                Behind the Scenes
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => scrollCarousel("left")}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-popeyes-orange"
                aria-label="Scroll carousel left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-popeyes-orange"
                aria-label="Scroll carousel right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="carousel-snap flex gap-4 sm:gap-6 overflow-x-auto pb-4"
          >
            {CAROUSEL_IMAGES.map((img) => (
              <div
                key={img.id}
                className="group relative flex-shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/10"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-popeyes-orange/90 flex items-center justify-center text-white shadow-xl">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        ref={waitlistRef}
        id="waitlist"
        className="bg-warm-cream py-16 sm:py-20 lg:py-24"
      >
        <div className="container max-w-screen-2xl mx-auto px-4 md:px-8">
          <div className="max-w-xl mx-auto text-center scroll-reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-popeyes-orange/10 text-popeyes-orange text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Exclusive Event
            </div>

            <h2 className="text-[2.75rem] sm:text-5xl lg:text-7xl font-black font-display text-deep-text tracking-tighter mb-2 leading-[0.9] italic uppercase">
              Feel The <span className="text-popeyes-orange">Heat</span>
            </h2>

            <p className="text-base sm:text-xl font-bold text-popeyes-orange mb-6 px-4">
              PIE Radio x Popeyes® · Exclusive Live Event
            </p>


            <div className="flex flex-wrap justify-center md:justify-center gap-1.5 sm:gap-2 mb-8 px-2">
              {[
                "Live DJ sets",
                "Epic giveaways",
              ].map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-deep-text text-white text-[10px] min-[400px]:text-xs font-bold leading-none"
                >
                  {tag}
                </span>
              ))}
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 text-left px-2 sm:px-0">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-border/50 shadow-sm flex items-start gap-3 sm:block">
                <MapPin className="w-5 h-5 text-popeyes-orange shrink-0 sm:mb-2" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5 sm:mb-1">Venue</p>
                  <p className="text-xs sm:text-sm font-bold text-deep-text leading-tight">
                    CUPRA City Garage, Manchester, M2 7LG
                  </p>
                </div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-border/50 shadow-sm flex items-start gap-3 sm:block">
                <Calendar className="w-5 h-5 text-popeyes-orange shrink-0 sm:mb-2" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5 sm:mb-1">Date & Time</p>
                  <p className="text-xs sm:text-sm font-bold text-deep-text leading-tight">
                    Friday 22nd May . 7PM - 11:30PM
                  </p>
                </div>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-border/50 shadow-sm flex items-start gap-3 sm:block">
                <Ticket className="w-5 h-5 text-popeyes-orange shrink-0 sm:mb-2" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5 sm:mb-1">Entry</p>
                  <p className="text-xs sm:text-sm font-bold text-deep-text leading-tight uppercase">
                    Free entry <span className="capitalize">(exclusive guest list)</span>
                  </p>
                </div>
              </div>
            </div>



            {formSuccess ? (
              <div className="bg-white rounded-2xl border border-popeyes-orange/30 p-8 sm:p-10 text-center animate-slide-in-up">
                <div className="w-16 h-16 rounded-full bg-popeyes-orange/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" role="img" aria-label="Party">
                    🎉
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-deep-text mb-2">
                  You&apos;re in!
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  We&apos;ll send event updates to{" "}
                  <span className="font-semibold text-deep-text">
                    {email || fullName}
                  </span>
                  .
                  <br />
                  Stay hungry. Stay vibing.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 shadow-lg scroll-reveal"
                noValidate
              >
                <div className="space-y-4">
                  <div className="text-left">
                    <label
                      htmlFor="full-name"
                      className="text-sm font-medium text-deep-text mb-1.5 block"
                    >
                      Full name <span className="text-cajun-red">*</span>
                    </label>
                    <Input
                      id="full-name"
                      name="fullName"
                      type="text"
                      placeholder="Joe Doe"
                      defaultValue={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="h-12 rounded-xl text-base"
                      required
                      autoComplete="name"
                    />
                  </div>

                  <div className="text-left">
                    <label
                      htmlFor="waitlist-email"
                      className="text-sm font-medium text-deep-text mb-1.5 block"
                    >
                      Email address <span className="text-cajun-red">*</span>
                    </label>
                    <Input
                      id="waitlist-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      defaultValue={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="h-12 rounded-xl text-base"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <label className="flex justify-center items-center items-start gap-2 text-xs md:text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={agreeToMarketing}
                      onChange={(e) => {
                        setAgreeToMarketing(e.target.checked);
                        if (formError) setFormError("");
                      }}
                      className="mt-1 h-4 w-4 accent-popeyes-orange rounded border-white/20 bg-white/10 text-popeyes-orange focus:ring-popeyes-orange"
                    />
                    <span className="leading-tight text-popeyes-orange font-xs text-start">
                      I agree to receive marketing emails, updates, and special
                      offers from Popeyes® UK.
                    </span>
                  </label>

                  {formError && (
                    <p
                      className="text-sm text-cajun-red text-left"
                      role="alert"
                      aria-live="assertive"
                    >
                      {formError}
                    </p>
                  )}

                  <SubmitButton />
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 border-t border-border/50">
        <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 text-center scroll-reveal">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Follow the vibe
          </p>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-deep-text mb-6">
            Stay Connected
          </h2>
          <div className="flex items-center justify-center gap-4">
            {[
              {
                Icon: InstagramIcon,
                label: "Instagram",
                platform: "instagram",
              },
              { Icon: XIcon, label: "X (Twitter)", platform: "twitter" },
              { Icon: FacebookIcon, label: "Facebook", platform: "facebook" },
            ].map(({ Icon, label, platform }) => (
              <a
                key={platform}
                href="https://www.instagram.com/popeyesuk/"
                onClick={(e) => {
                  e.preventDefault();
                  handleSocialClick(platform);
                }}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-border/50 flex items-center justify-center text-deep-text hover:bg-popeyes-orange hover:border-popeyes-orange hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-popeyes-orange focus:ring-offset-2"
                aria-label={`Follow us on ${label}`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-popeyes-orange via-cajun-red to-popeyes-orange py-10 sm:py-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 60 Q 15 40 30 60 T 60 60 T 90 60 T 120 60 V 100 H 0 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="container relative max-w-screen-2xl mx-auto px-4 md:px-8 text-center text-white">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 animate-float">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Coming Soon
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display mb-3">
            Something Delicious Is on the Way
          </h2>
          <p className="text-base sm:text-lg text-white/80 max-w-lg mx-auto leading-relaxed">
            We&apos;re putting the finishing touches on an unforgettable
            collaboration. Stay tuned.
          </p>
        </div>
      </section>
    </div>
  );
}
