import React from "react";
import { Trophy, Flame, Sparkles, Shield, Award, ChevronRight, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface GamificationLeagueCardProps {
  currentXP?: number;
  targetXP?: number;
  rank?: number;
  leagueName?: "Perunggu" | "Perak" | "Emas" | "Diamond";
  daysLeft?: number;
}

export function GamificationLeagueCard({
  currentXP = 680,
  targetXP = 1000,
  rank = 3,
  leagueName = "Emas",
  daysLeft = 4,
}: GamificationLeagueCardProps) {
  const percent = Math.min(100, Math.round((currentXP / targetXP) * 100));

  const leagueBadges = [
    { title: "7-Day Streak", icon: Flame, unlocked: true, desc: "Belajar 7 hari berturut-turut" },
    { title: "Quiz Master", icon: Zap, unlocked: true, desc: "Skor 100% pada 3 kuis" },
    { title: "Code Warrior", icon: Trophy, unlocked: true, desc: "Selesaikan 5 lab coding" },
    { title: "Helpful Peer", icon: Award, unlocked: false, desc: "Bantu 3 teman di forum Q&A" },
  ];

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm overflow-hidden relative">
      {/* Background Accent Glow */}
      <div className="absolute -right-10 -top-10 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xl shadow-xs border border-amber-500/20">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-base">Liga Mingguan Divisi {leagueName}</h3>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono">
                Peringkat #{rank}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Sisa Waktu Musim Ini: {daysLeft} Hari Lagi
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Total Poin XP</span>
          <p className="font-mono text-lg font-bold text-primary">{currentXP} XP ⚡</p>
        </div>
      </div>

      {/* Promotion Bar */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">Menuju Divisi Diamond</span>
          <span className="font-bold text-foreground">{currentXP} / {targetXP} XP ({percent}%)</span>
        </div>
        <Progress value={percent} className="h-2.5 bg-secondary" />
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Dapatkan <strong>{targetXP - currentXP} XP lagi</strong> untuk otomatis promosi ke liga berikutnya!
        </p>
      </div>

      {/* Badges Showcase */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-foreground mb-3">
          <span>Lencana Pencapaian Terbuka</span>
          <span className="font-mono text-[10px] text-primary">3 / 4 Lencana</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {leagueBadges.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  b.unlocked
                    ? "bg-secondary/40 border-primary/30 text-foreground shadow-2xs"
                    : "bg-background/40 border-border/40 text-muted-foreground opacity-50"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${
                    b.unlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold truncate w-full">{b.title}</p>
                <span className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{b.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
