"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PresenterShowDescriptionProps {
  description: string;
}

export function PresenterShowDescription({
  description,
}: PresenterShowDescriptionProps) {
  const descriptionId = useId();
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = paragraphRef.current;
    if (!el || expanded) return;

    const measure = () => {
      const node = paragraphRef.current;
      if (!node || expanded) return;
      setTruncated(node.scrollHeight > node.clientHeight + 1);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [description, expanded]);

  const showToggle = truncated || expanded;

  return (
    <div className="mt-1">
      <p
        id={descriptionId}
        ref={paragraphRef}
        className={cn(
          "text-sm text-muted-foreground",
          !expanded && "line-clamp-2 md:line-clamp-none",
        )}
      >
        {description}
      </p>
      {showToggle && (
        <Button
          type="button"
          variant="link"
          aria-expanded={expanded}
          aria-controls={descriptionId}
          className="md:hidden mt-0.5 h-auto min-h-0 p-0 text-sm font-medium"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  );
}
