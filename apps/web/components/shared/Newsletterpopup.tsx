"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Radio, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "@/app/actions/waitlist";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

const POPUP_FREQUENCY_DAYS = 2;
const STORAGE_KEY = "last_waitlist_popup_seen";
const TERMS_URL = "https://www.pieradio.co.uk/terms";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 sm:h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base sm:text-lg shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
    >
      {pending ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      ) : (
        "Sign up"
      )}
    </Button>
  );
}

export function EventWaitlistPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  const closePopup = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  const triggerPopup = useCallback(() => {
    if (isOpen) return;

    const lastSeen = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastSeen) {
      const daysSince = (now - parseInt(lastSeen)) / (1000 * 60 * 60 * 24);
      if (daysSince < POPUP_FREQUENCY_DAYS) return;
    }

    setIsOpen(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isHomePage) return;

    const timer = setTimeout(() => {
      triggerPopup();
    }, 30000);

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      if (scrollPercent > 60) {
        triggerPopup();
      }
    };

    const handleExitIntent = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        triggerPopup();
      }
    };

    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mouseleave", handleExitIntent);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, [isHomePage, triggerPopup]);

  async function handleSubmit(formData: FormData) {
    setFormError("");
    formData.append("marketingConsent", "true");

    try {
      const result = await joinWaitlist(null, formData);
      if (result.success) {
        setFormSuccess(true);
        toast.success("You're signed up for Pie Radio updates!");
        setTimeout(closePopup, 3000);
      } else {
        setFormError(result.message || "Something went wrong.");
      }
    } catch {
      setFormError("Connection error. Please try again.");
    }
  }

  if (!isHomePage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="absolute inset-0 bg-[#141827]/70 backdrop-blur-sm"
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-popup-title"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div
              className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-[#4d63ff]"
              aria-hidden
            />

            <button
              type="button"
              onClick={closePopup}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close newsletter signup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
                <Radio className="w-3 h-3" aria-hidden />
                Join the movement
              </div>

              <h2
                id="newsletter-popup-title"
                className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight mb-2 leading-tight"
              >
                Number one{" "}
                <span className="text-primary italic">youth station</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
                Register for Pie Radio&apos;s newsletters and other interesting
                updates.
              </p>

              {formSuccess ? (
                <div className="py-8 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2
                      className="w-8 h-8 text-primary"
                      aria-hidden
                    />
                  </div>
                  <h3 className="text-xl font-bold font-display text-foreground mb-2">
                    You&apos;re signed up!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Watch your inbox for news and updates from Pie Radio.
                  </p>
                </div>
              ) : (
                <form action={handleSubmit} className="space-y-4">
                  <input type="hidden" name="source" value="homepage_popup" />

                  <div className="text-left">
                    <Input
                      name="fullName"
                      placeholder="Full Name"
                      required
                      autoComplete="name"
                      className="h-11 rounded-xl bg-background border-input focus-visible:ring-primary"
                    />
                  </div>
                  <div className="text-left">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      required
                      autoComplete="email"
                      className="h-11 rounded-xl bg-background border-input focus-visible:ring-primary"
                    />
                  </div>

                  {formError && (
                    <p
                      className="text-xs text-destructive text-center font-medium"
                      role="alert"
                    >
                      {formError}
                    </p>
                  )}

                  <SubmitButton />

                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                    By signing up, you agree to receive updates from Pie Radio
                    and to our{" "}
                    <Link
                      href={TERMS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80"
                    >
                      terms of service
                    </Link>
                    .
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
