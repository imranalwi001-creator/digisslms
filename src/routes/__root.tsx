import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Digisschool — Digital Islamic Boarding School LMS" },
      { name: "description", content: "Platform pembelajaran digital terpadu untuk santri dan siswa Digital Islamic Boarding School." },
      { name: "author", content: "Digisschool" },
      { property: "og:title", content: "Digisschool — Digital Islamic Boarding School LMS" },
      { property: "og:description", content: "Platform pembelajaran digital terpadu untuk santri dan siswa Digital Islamic Boarding School." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://digisschool.my.id" },
      { property: "og:image", content: "/digisschool-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Digisschool — Digital Islamic Boarding School LMS" },
      { name: "twitter:description", content: "Platform pembelajaran digital terpadu untuk santri dan siswa Digital Islamic Boarding School." },
      { name: "twitter:image", content: "/digisschool-logo.png" },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://digisschool.my.id",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/digisschool-logo.png",
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    scripts: [
      {
        children: `
          (function() {
            var theme = localStorage.getItem('continuum_theme') || 'light';
            if (theme === 'system') {
              theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            if (theme === 'dark') document.documentElement.classList.add('dark');
          })();
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="pb-[env(safe-area-inset-bottom)]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <div className="animate-page-enter pb-16 md:pb-0">
        <Outlet />
      </div>
      <MobileBottomNav />
      <Toaster position="top-center" />
    </>
  );
}
