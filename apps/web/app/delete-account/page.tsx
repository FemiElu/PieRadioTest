import React from "react";
import Link from "next/link";
import { ChevronLeft, Trash2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-zinc-100">
        <div className="bg-primary p-8 text-white">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-primary-foreground/80 hover:text-white transition-colors mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold font-display">Account Deletion Request</h1>
          <p className="mt-2 text-primary-foreground/80 leading-relaxed">
            At Pie Radio, we value your privacy and give you full control over your personal data.
          </p>
        </div>

        <div className="p-8 space-y-10">
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Trash2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">How to Delete Your Account</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                <h3 className="font-bold text-zinc-900">1. Via the Mobile App</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  The fastest way to delete your data. Open the Pie Radio app, go to <strong>Profile</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Delete Account</strong>. Your data is wiped immediately.
                </p>
              </div>
              
              <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-3">
                <h3 className="font-bold text-zinc-900">2. Via Email Request</h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  If you no longer have the app installed, email us at <strong>info@pieradio.co.uk</strong> with the subject &quot;Account Deletion Request&quot;. Include your registered email address.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <ShieldCheck className="w-6 h-6" />
              <h2 className="text-xl font-bold">Data Removal Policy</h2>
            </div>
            <div className="prose prose-zinc max-w-none text-zinc-600">
              <p>When you request account deletion, the following data is permanently removed from our systems:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Your personal profile information (Email, Name, Avatar).</li>
                <li>Your saved favorites, presenters, and listening history.</li>
                <li>All app-specific preferences and notification settings.</li>
              </ul>
              <p className="mt-4 text-sm bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 italic">
                <strong>Note:</strong> Data is deleted immediately when processed via the app. Manual requests via email are typically processed within 5-7 business days.
              </p>
            </div>
          </section>

          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500">
              Questions? Contact us at <a href="mailto:info@pieradio.co.uk" className="text-primary hover:underline">info@pieradio.co.uk</a>
            </p>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/privacy">View Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
