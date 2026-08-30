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
  className = "",
  children,
}: {
  value?: string | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const src = useProfileMedia(value);
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background ${className}`}>
      {src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/25 to-transparent" />
      {children}
    </div>
  );
}

export function ProfileAvatar({
  value,
  name,
  className = "h-20 w-20",
}: {
  value?: string | null;
  name?: string | null;
  className?: string;
}) {
  const src = useProfileMedia(value);
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-background/60 bg-primary/15 text-2xl font-bold text-primary shadow-lg ${className}`}
    >
      {src ? (
        <img src={src} alt={name || "Foto profil"} className="h-full w-full object-cover" />
      ) : (
        (name || "S").slice(0, 1).toUpperCase()
      )}
    </div>
  );
}
