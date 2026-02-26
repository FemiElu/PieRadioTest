"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Calendar, Share2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-warm-cream pb-20">
      {/* Navigation / Header */}
      <div className="bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="container max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/partnership"
            className="flex items-center gap-2 text-deep-text hover:text-popeyes-orange transition-colors font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Partnership
          </Link>
        </div>
      </div>

      <article className="container max-w-screen-md mx-auto px-4 pt-12">
        {/* Brand Logo */}
        <div className="mb-10 animate-fade-in">
          <Image
            src="/assets/header-logo-popeye.png"
            alt="Popeyes Louisiana Kitchen"
            width={180}
            height={60}
            className="h-12 w-auto"
          />
        </div>

        {/* Categories & Date */}
        <div className="flex items-center gap-4 mb-6">
          <span className="px-3 py-1 bg-popeyes-orange text-white text-[10px] uppercase font-bold tracking-widest rounded-full">
            Press Release
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-5xl font-bold font-display text-deep-text leading-tight mb-6 uppercase">
          POPEYES® UK ANNOUNCES MANCHESTER PICCADILLY RESTAURANT OPENING DATE
          WITH EPIC LAUNCH DAY GIVEAWAYS
        </h1>

        {/* Sub-headline */}
        <p className="text-xl md:text-2xl font-semibold text-deep-text/80 italic leading-relaxed mb-12 border-l-4 border-popeyes-orange pl-6">
          Fried chicken fans in central Manchester can satisfy their Popeyes
          cravings at Manchester Piccadilly Station from Friday, 6th March
        </p>

        {/* Main Body Section 1 */}
        <div className="prose prose-zinc max-w-none text-deep-text/90">
          <p className="text-lg leading-relaxed mb-6">
            <span className="font-bold text-popeyes-orange uppercase">
              Popeyes® UK
            </span>{" "}
            has announced that its Manchester Piccadilly restaurant,
            conveniently located just outside the Piccadilly & City Centre
            Entrance, will open its doors at 11am on Friday 6th March 2026,
            continuing the brand&apos;s ambitious regional expansion across
            Greater Manchester.
          </p>
          <p className="text-lg leading-relaxed mb-8">
            Marking its seventh opening of 2026 and its sixth restaurant across
            Greater Manchester, Popeyes® will once again be pulling out all the
            stops, showcasing its New Orleans hospitality with exciting launch
            day giveaways for locals.
          </p>

          {/* Image Section */}
          <div className="my-12 relative aspect-video rounded-3xl overflow-hidden shadow-2xl group">
            <Image
              src="/assets/popeyes_manchester_0001.webp"
              alt="Popeyes Manchester Piccadilly exterior"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 800px"
            />
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-sm font-medium">
                New Manchester Piccadilly Location — Opening March 6th
              </p>
            </div>
          </div>

          {/* Main Body Section 2 */}
          <p className="text-lg leading-relaxed mb-6">
            On opening day, the first three customers will win the ultimate
            prize of free Deluxe Chicken Sandwiches for an entire year*. Plus,
            the first 50 customers in the queue will be treated to exclusive
            Popeyes® UK merchandise, and the first 100 will bag a free Deluxe
            Chicken Sandwich. To top it all off, Popeyes® is bringing the spirit
            of New Orleans with a performance from Mardi Gras-style band, The
            Brass Funkeys as well as DJ sets from{" "}
            <Link
              href="/"
              className="text-popeyes-orange font-bold hover:underline"
            >
              Pie Radio
            </Link>
            .
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Popeyes® opening days continue to draw huge crowds across Greater
            Manchester, with Bolton fans lining up from 2am for the brand&apos;s
            first opening of 2026. With Manchester Piccadilly Station welcoming
            over 120,000 visitors each day, hungry customers are advised to get
            down early on launch day to avoid missing out on the epic giveaways.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Tourists, locals and commuters alike will soon be able to dine in or
            takeaway, enjoying fan favourites like the iconic Popeyes Chicken
            Sandwich, Signature Wraps and the Saucin&apos; Boneless &amp; Hot
            Wings range as well as Hand Spun Shakes.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Building on its core menu, Popeyes® is turning up the flavour with
            the launch of its new Kickback Collection, centred around the
            brand&apos;s signature smoky, tangy and pickle-y Kickback Dip. A
            true fan favourite, the dip has already seen more than 19.37 million
            millilitres sold since its introduction in November alone.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Rolling out nationwide, the Kickback Sandwich leads the line-up,
            featuring Popeyes® iconic 100% fresh, Shatter Crunchin&apos;
            chicken, topped with smoked cheese, fresh pickles and the signature
            Kickback Sauce, all nestled in a soft brioche bun.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Also landing is the Kickback Box Meal, starring the Kickback
            Sandwich alongside a choice of two Tenders, three Hot Wings or four
            Boneless pieces, served with regular Fries, a drink and an extra
            Kickback Dip for maximum smoky, tangy enjoyment.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            All Popeyes® chicken is halal certified and marinated for 12 hours
            in its signature blend of bold Louisiana seasoning, then
            hand-breaded and battered to deliver that world-famous
            &apos;Shatter-Crunch&apos;.
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Tom Crowley, Popeyes® UK CEO, said: &quot;Manchester Piccadilly is
            one of the UK&apos;s busiest transport hubs, so it&apos;s the
            perfect location to connect with commuters and tourists every day.
            We&apos;re excited to bring our signature Louisiana chicken and New
            Orleans hospitality to the heart of the city and continue our growth
            journey in the region.&quot;
          </p>
          <p className="text-lg leading-relaxed mb-6">
            The new restaurant will be located at Unit 17, Gateway House,
            Piccadilly, and brings 55 new jobs to the local area. Plans include
            17 seats inside and 20 outside, self-service kiosks and collection
            points for orders made online via the Popeyes® UK{" "}
            <Link
              href="https://popeyesuk.com/"
              className="text-popeyes-orange font-bold hover:underline"
            >
              website
            </Link>{" "}
            or{" "}
            <Link
              href="https://popeyesuk.com/"
              className="text-popeyes-orange font-bold hover:underline"
            >
              official app
            </Link>
            .
          </p>
          <p className="text-lg leading-relaxed mb-6">
            To stay updated, visit the Popeyes® UK website or follow the brand
            on Instagram at{" "}
            <Link
              href="https://www.instagram.com/popeyesuk/"
              className="text-popeyes-orange font-bold hover:underline"
            >
              @PopeyesUK
            </Link>{" "}
            or TikTok at{" "}
            <Link
              href="https://www.tiktok.com/@popeyesuk"
              className="text-popeyes-orange font-bold hover:underline"
            >
              @Popeyesuk
            </Link>
            .
          </p>
        </div>

        {/* Footer / Notes */}
        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-border/50 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">
                Learn more about our collaboration with PieRadio.
              </p>
            </div>
            <Link href="/partnership">
              <Button className="bg-popeyes-orange hover:bg-popeyes-orange/90 text-white font-bold px-8 rounded-full">
                View Partnership
              </Button>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
