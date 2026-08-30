import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, Trophy, User, Layers } from "lucide-react";

export function MobileBottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const navItems = [
    {
      to: "/",
      label: "Beranda",
      icon: Home,
      isActive: currentPath === "/",
    },
    {
      to: "/dashboard",
      label: "Belajar",
      icon: BookOpen,
      isActive: currentPath.startsWith("/dashboard") || currentPath.startsWith("/materi"),
    },
    {
      to: "/dashboard",
      label: "Peringkat",
      icon: Trophy,
      isActive: false,
    },
    {
      to: "/admin",
      label: "Kelola",
      icon: Layers,
      isActive: currentPath.startsWith("/admin"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/80 pb-[env(safe-area-inset-bottom,0px)] shadow-lg transition-all duration-300">
      <div className="grid grid-cols-4 h-16 items-center px-2">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={idx}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 select-none ${
                active
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground font-medium"
              }`}
            >
              <div
                className={`relative p-1 rounded-xl transition-all ${
                  active ? "bg-primary/10 text-primary scale-110" : ""
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
