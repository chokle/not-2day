import { useState } from "react";
import { cn } from "@/lib/utils";
import { logoUrl } from "@/data/services";

export function ServiceLogo({
  name,
  domain,
  className,
}: {
  name: string;
  domain?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = logoUrl(domain);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-sm font-semibold text-muted-foreground",
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="size-7 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
