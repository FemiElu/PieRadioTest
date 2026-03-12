"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 py-16">
      <div className="max-w-xl mx-auto rounded-2xl border border-border/50 bg-card p-8 space-y-4">
        <h2 className="text-2xl font-bold font-display tracking-tight">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground">
          Please try again. If the issue persists, contact support.
        </p>
        <Button onClick={reset} className="rounded-full">
          Try again
        </Button>
      </div>
    </div>
  );
}

