import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="container max-w-screen-2xl mx-auto px-4 md:px-8 py-16">
      <div className="flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm font-medium">Loading…</span>
      </div>
    </div>
  );
}

