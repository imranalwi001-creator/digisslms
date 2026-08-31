import { Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon } from "lucide-react";
import { useSiteSettings, useSiteAsset } from "@/lib/site-settings";
import digisschoolLogo from "@/assets/digisschool-logo.png";

export function SiteFooter() {
  const { settings } = useSiteSettings();
  const logo = useSiteAsset(settings.logoUrl) || digisschoolLogo;

  return (
    <footer className="border-t border-border/60 bg-surface-alt py-10">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt={settings.brandName} className="h-5 w-auto object-contain" />
              ) : (
                <InfinityIcon className="w-5 h-5 text-foreground" strokeWidth={2.5} />
              )}
              <span className="font-semibold text-foreground text-xs">{settings.brandName}</span>
            </div>
            {settings.footer.description ? (
              <p className="max-w-xs text-center text-xs text-muted-foreground sm:text-left">
                {settings.footer.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-5 text-xs text-muted-foreground">
            <Link to="/" hash="paths" className="hover:text-foreground transition-colors">Kurikulum</Link>
            <Link to="/" hash="platform" className="hover:text-foreground transition-colors">Kapabilitas</Link>
            <Link to="/" hash="features" className="hover:text-foreground transition-colors">Fitur</Link>
            <Link to="/" hash="faq" className="hover:text-foreground transition-colors">Bantuan</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Masuk</Link>
          </div>

          <p className="text-[11px] font-mono text-muted-foreground">
            © {new Date().getFullYear()} {settings.footer.copyright || settings.brandName} · Terpadu
          </p>
        </div>
      </div>
    </footer>
  );
}
