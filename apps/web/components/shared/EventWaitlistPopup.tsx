"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Sparkles, MapPin, Calendar, Ticket, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "@/app/actions/waitlist";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

const POPUP_FREQUENCY_DAYS = 2;
const STORAGE_KEY = "last_waitlist_popup_seen";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-11 sm:h-12 rounded-xl bg-popeyes-orange hover:bg-popeyes-orange/90 text-white font-bold text-base sm:text-lg shadow-lg shadow-popeyes-orange/20 transition-all active:scale-[0.98]"
    >
      {pending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        "Join Guest List"
      )}
    </Button>
  );
}

export function EventWaitlistPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const pathname = usePathname();

  // Only show on the home page
  const isHomePage = pathname === "/";

  const closePopup = useCallback(() => {
    setIsOpen(false);
    // Mark as seen for X days
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

    // 1. Time Delay Trigger (30 seconds)
    const timer = setTimeout(() => {
      triggerPopup();
    }, 30000);

    // 2. Scroll Trigger (60%)
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 60) {
        triggerPopup();
      }
    };

    // 3. Exit Intent Trigger
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
    // Default marketing consent to true for the popup to simplify
    formData.append("marketingConsent", "true");
    
    try {
      const result = await joinWaitlist(null, formData);
      if (result.success) {
        setFormSuccess(true);
        toast.success("Welcome to the guest list!");
        // Auto-close after 3 seconds on success
        setTimeout(closePopup, 3000);
      } else {
        setFormError(result.message || "Something went wrong.");
      }
    } catch (err) {
      setFormError("Connection error. Please try again.");
    }
  }

  if (!isHomePage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
            className="absolute inset-0 bg-deep-text/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-warm-cream rounded-3xl shadow-2xl overflow-hidden border border-white/20"
          >
            <button
              onClick={closePopup}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-deep-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-popeyes-orange/10 text-popeyes-orange text-[10px] font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-3 h-3" />
                Exclusive Event
              </div>

              <h2 className="text-3xl sm:text-4xl font-black font-display text-deep-text tracking-tighter mb-2 leading-none italic uppercase">
                Feel The <span className="text-popeyes-orange">Heat</span>
              </h2>
              <p className="text-sm sm:text-base font-bold text-popeyes-orange mb-6">
                You&apos;re invited to the PIE Radio x Popeyes® Live Event
              </p>

              {formSuccess ? (
                <div className="py-8 animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 rounded-full bg-popeyes-orange/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl" role="img" aria-label="Party">🎉</span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-deep-text mb-2">You&apos;re in!</h3>
                  <p className="text-sm text-muted-foreground">Check your email for event updates.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                    <div className="p-3 rounded-xl bg-white/50 border border-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-popeyes-orange" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Date</p>
                        <p className="text-xs font-bold text-deep-text">Fri 22 May</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/50 border border-white flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-popeyes-orange" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Entry</p>
                        <p className="text-xs font-bold text-deep-text">Free Guest List</p>
                      </div>
                    </div>
                  </div>

                  <form action={handleSubmit} className="space-y-4">
                    <div className="text-left">
                      <Input
                        name="fullName"
                        placeholder="Full Name"
                        required
                        className="h-11 rounded-xl bg-white border-white/50 focus:ring-popeyes-orange"
                      />
                    </div>
                    <div className="text-left">
                      <Input
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        required
                        className="h-11 rounded-xl bg-white border-white/50 focus:ring-popeyes-orange"
                      />
                    </div>

                    {formError && (
                      <p className="text-xs text-cajun-red text-center font-bold">{formError}</p>
                    )}

                    <SubmitButton />
                    
                    <p className="text-[10px] text-muted-foreground leading-tight italic">
                      By signing up, you agree to receive updates about the FEEL THE HEAT event.
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
