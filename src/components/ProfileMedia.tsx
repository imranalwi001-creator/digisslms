import { useEffect, useState } from "react";
import { resolveProfileMedia } from "@/lib/profile";

/** Resolves stored profile media (storage path or absolute URL) into a displayable src. */
export function useProfileMedia(value?: string | null) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setSrc(null);
    resolveProfileMedia(value)
      .then((url) => active && setSrc(url))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [value]);
  return src;
}

export function ProfileBanner({
  value,
  className = "h-48 sm:h-64",
  children,
}: {
  value?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const src = useProfileMedia(value);
  return (
    <div className={`relative overflow-hidden bg-surface-alt border-b border-border/80 ${className}`}>
      {src ? (
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-secondary/30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

export function ProfileAvatar({
  value,
  name,
  className = "h-24 w-24 sm:h-28 sm:w-28",
  ringClass = "ring-4 ring-background shadow-md",
}: {
  value?: string | null;
  name?: string | null;
  className?: string;
  ringClass?: string;
}) {
  const src = useProfileMedia(value);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-card border border-border text-2xl sm:text-3xl font-display font-semibold text-primary ${ringClass} ${className}`}
    >
      {src ? (
        <img src={src} alt={name || "Foto profil"} className="h-full w-full object-cover" />
      ) : (
        <span>{(name || "S").slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
}
