import { useMemo, useState } from "react";
import { BellRing, Clock, Settings2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  channelLabel,
  frequencyLabel,
  leadOptions,
  useClassReminders,
  type ReminderChannel,
  type ReminderFrequency,
  type WatchedStudent,
} from "@/lib/class-reminders";
import { dayNames, type Schedule } from "@/lib/teaching";

/** Opt-in reminder panel with per-class and per-student customisation. */
export function ClassReminderCard({
  schedules,
  audience,
  roster = [],
}: {
  schedules: Schedule[];
  audience: "staff" | "student";
  roster?: WatchedStudent[];
}) {
  const {
    settings,
    updateGlobal,
    updateClass,
    resetClass,
    toggleStudent,
    permission,
    enable,
    upcoming,
    resolve,
  } = useClassReminders(schedules, audience, roster);
  const [open, setOpen] = useState(false);
  const active = settings.global.enabled;

  const grades = useMemo(
    () => [...new Set(schedules.map((s) => s.grade))].sort((a, b) => a - b),
    [schedules],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <BellRing className="h-4 w-4 text-primary" /> Pengingat jadwal
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {audience === "staff"
              ? "Atur waktu, kanal, dan frekuensi pengingat per kelas — plus siswa yang ingin dipantau."
              : "Notifikasi otomatis sebelum pelajaranmu dimulai."}
          </p>
        </div>
        <Badge variant={active ? "default" : "secondary"}>{active ? "Aktif" : "Nonaktif"}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select
          value={String(settings.global.leadMinutes)}
          onValueChange={(v) => updateGlobal({ leadMinutes: Number(v) })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {leadOptions.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m} menit sebelum
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={settings.global.channel}
          onValueChange={(v) => updateGlobal({ channel: v as ReminderChannel })}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(channelLabel) as ReminderChannel[]).map((c) => (
              <SelectItem key={c} value={c}>
                {channelLabel[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {active ? (
          <Button size="sm" variant="outline" onClick={() => updateGlobal({ enabled: false })}>
            Matikan
          </Button>
        ) : (
          <Button size="sm" onClick={() => void enable()}>
            Aktifkan pengingat
          </Button>
        )}

        {audience === "staff" && (
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            <Settings2 className="mr-2 h-4 w-4" />
            {open ? "Tutup pengaturan" : "Pengaturan per kelas"}
          </Button>
        )}
      </div>

      {permission === "denied" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Notifikasi browser diblokir — pengingat tetap muncul di dalam aplikasi.
        </p>
      )}
      {permission === "unsupported" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Browser ini tidak mendukung notifikasi sistem; pengingat memakai kanal dalam aplikasi.
        </p>
      )}

      {audience === "staff" && open && (
        <div className="mt-4 space-y-3">
          {grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada jadwal untuk diatur.</p>
          ) : (
            grades.map((grade) => {
              const scope = resolve(grade);
              const overridden = Boolean(settings.classes[String(grade)]);
              return (
                <div key={grade} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">Kelas {grade}</p>
                    <div className="flex items-center gap-2">
                      {overridden && (
                        <Button size="sm" variant="ghost" onClick={() => resetClass(grade)}>
                          Ikuti default
                        </Button>
                      )}
                      <Switch
                        checked={scope.enabled}
                        onCheckedChange={(v) => updateClass(grade, { enabled: v })}
                        aria-label={`Pengingat kelas ${grade}`}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Waktu</Label>
                      <Select
                        value={String(scope.leadMinutes)}
                        onValueChange={(v) => updateClass(grade, { leadMinutes: Number(v) })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {leadOptions.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {m} menit sebelum
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Kanal</Label>
                      <Select
                        value={scope.channel}
                        onValueChange={(v) => updateClass(grade, { channel: v as ReminderChannel })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(channelLabel) as ReminderChannel[]).map((c) => (
                            <SelectItem key={c} value={c}>
                              {channelLabel[c]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Frekuensi</Label>
                      <Select
                        value={scope.frequency}
                        onValueChange={(v) => updateClass(grade, { frequency: v as ReminderFrequency })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(frequencyLabel) as ReminderFrequency[]).map((f) => (
                            <SelectItem key={f} value={f}>
                              {frequencyLabel[f]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {roster.some((s) => s.grade === grade) && (
                    <div className="mt-3">
                      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <Users className="h-3 w-3" /> Siswa yang dipantau
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {roster
                          .filter((s) => s.grade === grade)
                          .map((s) => {
                            const on = settings.watchedStudents.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => toggleStudent(s.id)}
                                className={[
                                  "rounded-full border px-2.5 py-1 text-xs transition",
                                  on
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/60 text-muted-foreground hover:border-primary/40",
                                ].join(" ")}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hari ini</p>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Tidak ada jadwal hari ini.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {upcoming.slice(0, 4).map(({ schedule, start }) => (
              <li
                key={schedule.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{schedule.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dayNames[schedule.dayOfWeek]} · {schedule.startTime}–{schedule.endTime} · Kelas {schedule.grade}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {start.getTime() > Date.now()
                    ? `${Math.max(1, Math.round((start.getTime() - Date.now()) / 60000))} mnt`
                    : "berlangsung"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
