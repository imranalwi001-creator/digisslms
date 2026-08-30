import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  HelpCircle,
  MessageSquare,
  Award,
  BookOpen,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getStoredNotifications,
  saveNotifications,
  type LMSNotification,
} from "@/lib/notifications";
import { toast } from "sonner";

export function NotificationHub() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<LMSNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "academic" | "social" | "system">("all");
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = () => {
    setNotifications(getStoredNotifications());
  };

  useEffect(() => {
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener("digisschool:notif_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("digisschool:notif_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "all") return true;
    return n.category === activeFilter;
  });

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
    toast.success("Semua notifikasi ditandai telah dibaca");
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
    toast.info("Semua notifikasi dibersihkan");
  };

  const handleNotificationClick = (item: LMSNotification) => {
    markAsRead(item.id);
    if (item.link) {
      setIsOpen(false);
      navigate({ to: item.link });
    }
  };

  const getIcon = (type: LMSNotification["type"]) => {
    switch (type) {
      case "assignment_created":
      case "assignment_submitted":
        return <FileText className="w-4 h-4 text-sky-500" />;
      case "quiz_submitted":
        return <HelpCircle className="w-4 h-4 text-emerald-500" />;
      case "qa_posted":
      case "qa_replied":
      case "note_saved":
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case "certificate_issued":
      case "rapor_ready":
        return <Award className="w-4 h-4 text-amber-500" />;
      case "material_enrolled":
      case "module_completed":
        return <BookOpen className="w-4 h-4 text-primary" />;
      case "system_sync":
      default:
        return <RefreshCw className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative min-h-10 min-w-10 rounded-xl p-2 text-foreground/80 hover:text-foreground hover:bg-muted/80 transition-all active:scale-95 flex items-center justify-center border border-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs"
          aria-label="Pusat Notifikasi"
        >
          <Bell className="w-5 h-5 stroke-[2.2]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground shadow-md animate-subtle-pulse border-2 border-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-[380px] p-0 rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary" />
                Pemberitahuan
              </h4>
              {unreadCount > 0 && (
                <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] font-mono font-bold">
                  {unreadCount} baru
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
                  title="Tandai semua telah dibaca"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Baca semua
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-2"
                  title="Bersihkan daftar notifikasi"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Semua" },
              { id: "academic", label: "Akademik" },
              { id: "social", label: "Diskusi" },
              { id: "system", label: "Sistem" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications Scrollable Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {filteredNotifications.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              <div className="w-10 h-10 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                <Bell className="w-5 h-5 opacity-40" />
              </div>
              <p className="font-semibold text-foreground">Tidak ada notifikasi</p>
              <p className="text-[11px] mt-0.5">Semua aktivitas CRUD dan pembaruan akan muncul di sini.</p>
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/50 cursor-pointer relative ${
                  !item.read ? "bg-primary/5 font-medium" : "bg-transparent"
                }`}
              >
                {/* Icon */}
                <div className="p-2 rounded-xl bg-background border border-border/60 shrink-0 mt-0.5 shadow-2xs">
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pr-6">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs truncate ${!item.read ? "font-bold text-foreground" : "font-semibold text-foreground/80"}`}>
                      {item.title}
                    </p>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {item.message}
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 block">
                    {item.timestamp}
                  </span>
                </div>

                {/* Delete hover button */}
                <button
                  onClick={(e) => deleteNotification(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-3 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Hapus pemberitahuan ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
