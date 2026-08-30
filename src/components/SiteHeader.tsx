import { Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useSiteSettings, useSiteAsset } from "@/lib/site-settings";
import { NotificationHub } from "@/components/lms/NotificationHub";
import digisschoolLogo from "@/assets/digisschool-logo.png";

export function SiteHeader() {
  const { settings } = useSiteSettings();
  const logo = useSiteAsset(settings.logoUrl) || digisschoolLogo;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/80 shadow-sm py-2.5"
          : "bg-background/80 md:bg-background/60 backdrop-blur-md border-b border-border/40 py-3.5"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {logo ? (
            <img src={logo} alt={settings.brandName} className="h-9 w-9 object-contain rounded-lg shrink-0 drop-shadow-2xs" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 shadow-2xs border border-primary/20">
              <InfinityIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-none">
              {settings.brandName}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-tight mt-0.5">
              Digital Islamic School
            </span>
          </div>
        </Link>

        {/* Dynamic High-Contrast Navigation Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {[
            { to: "/", hash: "courses", label: "Kelas Unggulan" },
            { to: "/", hash: "materials", label: "Katalog Materi" },
            { to: "/", hash: "paths", label: "Jalur Belajar" },
            { to: "/", hash: "features", label: "Fitur Platform" },
            { to: "/dashboard", hash: undefined, label: "Dashboard Siswa" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-all active:scale-95"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          <NotificationHub />
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20"
          >
            <span>Mulai Belajar</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
