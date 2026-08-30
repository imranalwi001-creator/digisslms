import React, { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CourseSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  selectedGrade: "all" | 7 | 8 | 9;
  onGradeChange: (grade: "all" | 7 | 8 | 9) => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  subjects?: string[];
}

export function CourseSearchBar({
  query,
  onQueryChange,
  selectedGrade,
  onGradeChange,
  selectedSubject,
  onSubjectChange,
  subjects = [
    "Semua",
    "Berpikir Komputasional",
    "Sistem Komputer",
    "Jaringan & Internet",
    "Analisis Data",
    "Algoritma & Pemrograman",
    "Dampak Sosial",
    "TIK & Web",
  ],
}: CourseSearchBarProps) {
  return (
    <div className="mb-6 space-y-4">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari materi, topik modul, atau mata pelajaran..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-11 pr-10 h-12 rounded-xl bg-card border-border/80 text-sm shadow-xs focus-visible:ring-primary"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Grade Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(["all", 7, 8, 9] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGradeChange(g)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
                selectedGrade === g
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/60"
              }`}
            >
              {g === "all" ? "Semua Kelas" : `Kelas ${g}`}
            </button>
          ))}
        </div>

        {/* Subject dropdown / chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {subjects.map((sub) => {
            const isSelected = (sub === "Semua" && selectedSubject === "all") || selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => onSubjectChange(sub === "Semua" ? "all" : sub)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-foreground text-background font-semibold"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
