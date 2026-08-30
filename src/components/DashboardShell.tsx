import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Infinity as InfinityIcon,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  Megaphone,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  GraduationCap,
  HelpCircle,
  FileText,
  Award,
  
  Presentation,
  CalendarDays,
  ClipboardCheck,
  BookMarked,
  CalendarRange,
  ClipboardList,
  TrendingUp,
  PanelLeftOpen,
  PanelLeftClose,
  Search,



  Trophy,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useRole, roleLabel } from "@/hooks/use-role";
import digisschoolLogo from "@/assets/digisschool-logo.png";
import { NotificationHub } from "@/components/lms/NotificationHub";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Dashboard & Ikhtisar", icon: LayoutDashboard },
  { to: "/dashboard?tab=chat", label: "Ruang Chat & Komunitas", icon: MessageSquare },
  { to: "/dashboard?tab=kelas", label: "Kelas & Materi Saya", icon: BookOpen },
  { to: "/dashboard?tab=tugas", label: "Tugas & Proyek", icon: FileText },
  { to: "/dashboard?tab=kuis", label: "Kuis & Evaluasi", icon: HelpCircle },
  { to: "/dashboard?tab=jadwal", label: "Jadwal & Presensi", icon: CalendarDays },
  { to: "/dashboard?tab=peringkat", label: "Peringkat & Liga XP", icon: Trophy },
  { to: "/dashboard?tab=sertifikat", label: "Prestasi & Sertifikat", icon: Award },
  { to: "/dashboard?tab=rapor", label: "E-Rapor Akademik", icon: GraduationCap },
  { to: "/dashboard?tab=progres", label: "Statistik Belajar", icon: TrendingUp },
  { to: "/settings", label: "Pengaturan Akun", icon: Settings },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/admin/periode", label: "Tahun ajaran", icon: CalendarRange },
  { to: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/admin/absensi", label: "Absensi", icon: ClipboardCheck },
  { to: "/admin/jurnal", label: "Jurnal harian", icon: BookMarked },
  { to: "/admin/rubrik", label: "Rubrik penilaian", icon: ClipboardList },
  { to: "/admin/progres", label: "Progres siswa", icon: TrendingUp },
  { to: "/admin/analitik", label: "Analitik kelas", icon: BarChart3 },
  { to: "/admin/siswa", label: "Siswa", icon: Users },
  { to: "/admin/materi", label: "Materi", icon: BookOpen },
  { to: "/admin/kuis", label: "Kuis", icon: HelpCircle },
  { to: "/admin/tugas", label: "Tugas", icon: FileText },
  { to: "/admin/sertifikat", label: "Sertifikat", icon: Award },
  { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/admin/pengaturan", label: "Pengaturan situs", icon: Settings },
  { to: "/dashboard", label: "Tampilan siswa", icon: GraduationCap },

];

const guruNav: NavItem[] = [
  { to: "/admin", label: "Ringkasan kelas", icon: LayoutDashboard },
  { to: "/admin/jadwal", label: "Jadwal", icon: CalendarDays },
  { to: "/admin/absensi", label: "Absensi", icon: ClipboardCheck },
  { to: "/admin/jurnal", label: "Jurnal harian", icon: BookMarked },
  { to: "/admin/rubrik", label: "Rubrik penilaian", icon: ClipboardList },
  { to: "/admin/progres", label: "Progres siswa", icon: TrendingUp },
  { to: "/admin/analitik", label: "Analitik kelas", icon: BarChart3 },
  { to: "/admin/siswa", label: "Siswa", icon: Users },
  { to: "/admin/materi", label: "Materi", icon: BookOpen },
  { to: "/admin/kuis", label: "Kuis", icon: HelpCircle },
  { to: "/admin/tugas", label: "Tugas", icon: FileText },
  { to: "/admin/sertifikat", label: "Sertifikat", icon: Award },
  { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  { to: "/dashboard", label: "Tampilan siswa", icon: GraduationCap },
];



interface Props {
  /** "staff" resolves to the signed-in user's actual role (admin or guru). */
  role: "admin" | "guru" | "student" | "staff";
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ role: roleProp, title, subtitle, actions, children }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();

  // Restore sidebar mode from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar:collapsed");
      if (saved !== null) setCollapsed(saved === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("sidebar:collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role: dbRole } = useRole(user?.id);
  const role: "admin" | "guru" | "student" =
    roleProp === "staff" ? (dbRole === "admin" ? "admin" : "guru") : roleProp;
  const allItems = role === "admin" ? adminNav : role === "guru" ? guruNav : studentNav;
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.to.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  // Longest matching path = active item (handles nested routes and search params)
  const activePath = useMemo(() => {
    const full = location.pathname + (location.search ? location.search : "");
    const direct = allItems.find((i) => i.to === full);
    if (direct) return direct.to;

    const path = location.pathname;
    let best = "";
    for (const i of allItems) {
      if (path === i.to || (i.to.startsWith(path) && !i.to.includes("?"))) {
        if (i.to.length > best.length) best = i.to;
      }
    }
    return best || allItems[0]?.to || "";
  }, [allItems, location.pathname, location.search]);

  const closeMobile = () => {
    setOpen(false);
    setQuery("");
  };

  const drawerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Keyboard support for the mobile drawer: Escape closes, Tab is trapped,
  // focus moves in on open and returns to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    // Move focus into the drawer
    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMobile();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const firstEl = list[0];
      const lastEl = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === firstEl || !drawerRef.current?.contains(active)) {
          e.preventDefault();
          lastEl.focus();
        }
      } else if (active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      (previouslyFocused ?? menuButtonRef.current)?.focus?.();
    };
  }, [open]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const sidebarContent = (mini: boolean) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className={["flex items-center gap-2.5 px-4 pt-5 pb-3", mini ? "justify-center" : ""].join(" ")}>
        <Link
          to="/"
          aria-label="Beranda Digisschool"
          className="flex items-center gap-2.5 min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img src={digisschoolLogo} alt="Digisschool Logo" className="w-7 h-7 object-contain shrink-0" />
          {!mini && <span className="truncate font-bold tracking-tight text-foreground">Digisschool</span>}
        </Link>
      </div>

      <div className={["px-4 pb-3", mini ? "px-2" : ""].join(" ")}>
        <div
          className={[
            "flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 py-2.5",
            mini ? "justify-center px-2" : "px-3",
          ].join(" ")}
          title={user?.email ?? undefined}
        >
          {role === "admin" ? (
            <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
          ) : role === "guru" ? (
            <Presentation className="w-4 h-4 shrink-0 text-primary" />
          ) : (
            <GraduationCap className="w-4 h-4 shrink-0 text-primary" />
          )}
          {!mini && (
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{roleLabel(role)}</p>
              <p className="truncate text-xs font-medium">{user?.email ?? "—"}</p>
            </div>
          )}
        </div>
      </div>

      {mini ? (
        <div className="px-2 pb-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            title="Cari halaman"
            aria-label="Cari halaman"
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-border/60 bg-muted/40 py-2.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && items.length > 0) {
                  navigate({ to: items[0].to });
                  closeMobile();
                } else if (e.key === "Escape") {
                  setQuery("");
                }
              }}
              placeholder="Cari halaman…"
              aria-label="Cari halaman"
              type="search"
              className="w-full rounded-xl border border-border/60 bg-muted/40 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 focus:bg-background"
            />
          </div>
        </div>
      )}

      <nav
        aria-label="Navigasi utama"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-2"
      >
        <div className="flex flex-col gap-1">
          {items.length === 0 && !mini && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Tidak ada halaman cocok.
            </p>
          )}
          {items.map(({ to, label, icon: Icon }) => {
            const active = to === activePath;
            return (
              <Link
                key={to}
                to={to}
                title={label}
                aria-current={active ? "page" : undefined}
                onClick={closeMobile}
                className={[
                  "relative flex min-h-11 items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  mini ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!mini && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border/60 p-3">
        <Button
          variant="ghost"
          className={["w-full gap-3 text-muted-foreground", mini ? "justify-center px-0" : "justify-start"].join(" ")}
          onClick={handleSignOut}
          title="Keluar"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!mini && "Keluar"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border/60 bg-background transition-[width] duration-200 lg:block",
          collapsed ? "w-[76px]" : "w-64",
        ].join(" ")}
      >
        {sidebarContent(collapsed)}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-background shadow-xl"
          >
            <button
              className="absolute right-3 top-4 z-10 rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={closeMobile}
              aria-label="Tutup menu"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent(false)}
          </aside>
        </div>
      )}

      <div className={collapsed ? "lg:pl-[76px]" : "lg:pl-64"}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              ref={menuButtonRef}
              className="min-h-11 min-w-11 rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              className="hidden rounded-lg p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              <NotificationHub />
              {actions}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-6 pb-16">{children}</main>
      </div>
    </div>
  );
}


export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="mt-3 font-mono text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs font-mono text-muted-foreground">{hint}</p>}
    </div>
  );
}
