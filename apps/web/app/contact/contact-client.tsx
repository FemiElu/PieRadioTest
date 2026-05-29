"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Copy, Check, ExternalLink, ArrowRight, MessageSquare, Briefcase, Globe, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ContactMethod {
  id: string;
  title: string;
  email: string;
  description: string;
  icon: React.ComponentType<any>;
  badge: string;
}

const contactMethods: ContactMethod[] = [
  {
    id: "general",
    title: "General Inquiries & Support",
    email: "hello@pieradio.co.uk",
    description: "Got questions, listener feedback, technical support inquiries, or want to discuss programming and schedule?",
    icon: MessageSquare,
    badge: "General & Help",
  },
  {
    id: "business",
    title: "Business & Partnerships",
    email: "officialpieradio@gmail.com",
    description: "Interested in advertising, show sponsorship, corporate partnerships, presenter bookings, or commercial collaborations?",
    icon: Briefcase,
    badge: "Official & Commercial",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function ContactClient() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      toast.success(`Copied ${email} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy email. Please copy it manually.");
    }
  };

  return (
    <div className="w-full bg-background py-8 md:py-16">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-primary text-xs font-bold uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full inline-block mb-4">
            Get in Touch
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-foreground tracking-tight mb-6">
            Contact Pie Radio
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Whether you want to share feedback, enquire about advertising, or discuss partnerships, our team is ready to connect with you. Choose the relevant email address below.
          </p>
        </motion.div>

        {/* Contact Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {contactMethods.map((method) => {
            const Icon = method.icon;
            const isCopied = copiedId === method.id;

            return (
              <motion.div
                key={method.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative flex flex-col justify-between p-6 md:p-8 rounded-2xl border border-border bg-card hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Decorative soft glowing blur on hover */}
                <div className="absolute -inset-px bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  {/* Card Header Info */}
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-300">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                      {method.badge}
                    </span>
                  </div>

                  {/* Card Main Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-display text-foreground">
                      {method.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {method.description}
                    </p>
                  </div>

                  {/* Email Box */}
                  <div className="p-4 bg-muted/50 dark:bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between gap-4 font-mono text-sm break-all font-medium text-foreground/90">
                    <span className="select-all">{method.email}</span>
                    <button
                      onClick={() => handleCopy(method.id, method.email)}
                      className="p-1.5 hover:bg-background rounded border border-border/80 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all flex-shrink-0"
                      title="Copy email address"
                      aria-label={`Copy ${method.email}`}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card CTA Actions */}
                <div className="relative z-10 pt-6 mt-6 border-t border-border/40 flex items-center gap-3">
                  <Button
                    asChild
                    className="flex-1 gap-2 font-semibold shadow-sm cursor-pointer group/btn"
                  >
                    <a href={`mailto:${method.email}`}>
                      <Mail className="h-4 w-4" />
                      Send Email
                      <ArrowRight className="h-3.5 w-3.5 ml-auto transform group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Information / Social section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="border border-border/60 bg-muted/20 dark:bg-muted/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <h4 className="font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
              <Globe className="h-4 w-4 text-primary animate-pulse" />
              Looking for our socials?
            </h4>
            <p className="text-sm text-muted-foreground max-w-md">
              Follow and slide into our DMs on Instagram, Facebook, TikTok, or YouTube. We update our schedules and broadcast schedules daily.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {[
              { name: "Instagram", url: "https://www.instagram.com/pieradiouk" },
              { name: "TikTok", url: "https://www.tiktok.com/@pieradiouk" },
              { name: "YouTube", url: "https://www.youtube.com/pieradiouk" },
            ].map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold hover:border-primary/40 hover:text-primary transition-all"
              >
                {social.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
