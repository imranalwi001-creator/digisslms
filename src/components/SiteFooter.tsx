import { Link } from "@tanstack/react-router";
import { Infinity as InfinityIcon } from "lucide-react";
import { useSiteSettings, useSiteAsset } from "@/lib/site-settings";
import digisschoolLogo from "@/assets/digisschool-logo.png";

export function SiteFooter() {
  const { settings } = useSiteSettings();
  const logo = useSiteAsset(settings.logoUrl) || digisschoolLogo;

  return (
    <footer className="border-t border-border/40 py-12">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex items-center gap-2">
              {logo ? (
                <img src={logo} alt={settings.brandName} className="h-6 w-auto object-contain" />
              ) : (
                <InfinityIcon className="w-6 h-6 text-foreground" strokeWidth={2.5} />
              )}
              <span className="font-semibold text-foreground text-sm">{settings.brandName}</span>
            </div>
            {settings.footer.description ? (
              <p className="max-w-xs text-center text-xs text-muted-foreground sm:text-left">{settings.footer.description}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <Link to="/" hash="features" className="hover:text-foreground transition-colors">Fitur</Link>
            <Link to="/" hash="how-it-works" className="hover:text-foreground transition-colors">Cara kerja</Link>
            <Link to="/" hash="reviews" className="hover:text-foreground transition-colors">Testimoni</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Masuk</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Daftar</Link>
          </div>

          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {settings.footer.copyright || settings.brandName}</p>
        </div>
      </div>
    </footer>
  );
}
