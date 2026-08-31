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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border/80 shadow-2xs py-2.5"
          : "bg-background/80 backdrop-blur-sm border-b border-border/40 py-3"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-5 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          {logo ? (
            <img src={logo} alt={settings.brandName} className="h-8 w-8 object-contain rounded-md shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors border border-primary/20">
              <InfinityIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-none">
              {settings.brandName}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-tight mt-0.5">
              Digital Islamic School
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { to: "/", hash: "courses", label: "Modul Pembelajaran" },
            { to: "/", hash: "paths", label: "Jalur Kurikulum" },
            { to: "/", hash: "platform", label: "Kapabilitas" },
            { to: "/", hash: "features", label: "Fitur Santri" },
            { to: "/dashboard", hash: undefined, label: "Dasbor Siswa" },
          ].map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-foreground/80 hover:text-foreground hover:bg-surface-alt transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          <NotificationHub />
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:brightness-105 transition-all active:scale-[0.98] shadow-2xs whitespace-nowrap"
          >
            <span>Mulai Belajar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
