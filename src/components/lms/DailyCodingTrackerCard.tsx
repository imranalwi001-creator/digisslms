import React, { useState, useEffect } from "react";
import {
  Code,
  CheckCircle2,
  Circle,
  Flame,
  Plus,
  Sparkles,
  Trophy,
  Trash2,
  Clock,
  Laptop,
  Check,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchHabitsFromDb,
  fetchHabitLogsFromDb,
  saveHabitToDb,
  deleteHabitFromDb,
  toggleHabitLogDb,
  isCompletedToday,
  getStreak,
  type Habit,
  type HabitLog,
} from "@/lib/habits";

interface DailyCodingTrackerCardProps {
  userId: string;
}

export function DailyCodingTrackerCard({ userId }: DailyCodingTrackerCardProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Add goal dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalTime, setNewGoalTime] = useState("");

  const loadData = async () => {
    try {
      const [h, l] = await Promise.all([
        fetchHabitsFromDb(userId),
        fetchHabitLogsFromDb(userId),
      ]);
      setHabits(h);
      setLogs(l);
    } catch (err) {
      console.warn("Failed to load daily coding goals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const handleToggle = async (habitId: string) => {
    const isNowDone = await toggleHabitLogDb(userId, habitId);
    // Reload logs
    const updatedLogs = await fetchHabitLogsFromDb(userId);
    setLogs(updatedLogs);

    if (isNowDone) {
      toast.success("🎯 Target coding harian tercapai! +25 XP", {
        description: "Terus pertahankan konsistensi latihan coding Anda.",
      });
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim()) {
      toast.warning("Nama target coding tidak boleh kosong");
      return;
    }

    const newHabit: Habit = {
      id: `goal-${Date.now()}`,
      name: newGoalName.trim(),
      description: newGoalDesc.trim() || "Target latihan coding mandiri santri.",
      color: "#10b981",
      frequency: { type: "daily" },
      reminderTime: newGoalTime || null,
      createdAt: new Date().toISOString(),
      userId,
    };

    await saveHabitToDb(userId, newHabit);
    setHabits([...habits, newHabit]);
    setNewGoalName("");
    setNewGoalDesc("");
    setNewGoalTime("");
    setOpenAdd(false);
    toast.success("Target coding baru berhasil ditambahkan!");
  };

  const handleDeleteGoal = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHabitFromDb(userId, habitId);
    setHabits(habits.filter((h) => h.id !== habitId));
    toast.info("Target coding dihapus.");
  };

  const completedCount = habits.filter((h) => isCompletedToday(h.id, logs)).length;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Target Coding & Praktik Harian</h3>
              <Badge variant="outline" className="text-[10px] font-mono gap-1 text-emerald-600 border-emerald-500/30">
                <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                Tersinkron Database
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bangun konsistensi logika pemrograman Informatika setiap hari.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpenAdd(true)}
          className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Target
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 p-3 rounded-2xl bg-background/60 border border-border/60">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span>Pencapaian Hari Ini:</span>
            <span className="font-bold text-foreground">
              {completedCount} dari {habits.length} Selesai
            </span>
          </span>
          <span className="font-extrabold text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2 rounded-full" />
      </div>

      {/* Habits Checklist Grid */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => {
          const isDone = isCompletedToday(habit.id, logs);
          const streak = getStreak(habit.id, logs);

          return (
            <div
              key={habit.id}
              onClick={() => handleToggle(habit.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group select-none ${
                isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                  : "bg-card border-border/80 hover:border-primary/40 hover:bg-muted/30 text-foreground"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : "border border-muted-foreground/40 text-transparent group-hover:border-primary"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold truncate ${
                      isDone ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {habit.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {habit.description}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-1 border-t border-border/40 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Flame className="w-3 h-3" /> {streak} Hari
                    </span>
                    {habit.reminderTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {habit.reminderTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDeleteGoal(habit.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                title="Hapus Target"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Goal Dialog Modal */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-border bg-card">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-bold text-foreground">
              Tambah Target Coding Harian
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tentukan target latihan pemrograman harian agar belajar lebih terarah.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGoal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Nama Target Coding</label>
              <Input
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="Contoh: Selesaikan 2 Studi Kasus Python"
                className="rounded-xl text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Keterangan / Deskripsi</label>
              <Input
                value={newGoalDesc}
                onChange={(e) => setNewGoalDesc(e.target.value)}
                placeholder="Contoh: Latihan percabangan logika if-else & loop"
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Waktu Latihan (Opsional)</label>
              <Input
                type="time"
                value={newGoalTime}
                onChange={(e) => setNewGoalTime(e.target.value)}
                className="rounded-xl text-xs font-mono"
              />
            </div>

            <DialogFooter className="gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenAdd(false)}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs font-bold">
                Simpan Target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
