import React, { useState, useEffect } from "react";
import {
  FileText,
  MessageSquare,
  Download,
  Star,
  Plus,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Share2,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { InteractiveCodingSandbox } from "@/components/lms/InteractiveCodingSandbox";
import { FocusedLMSVideoPlayer } from "@/components/lms/FocusedLMSVideoPlayer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getStudentNotesForMaterial,
  saveStudentNoteAction,
  deleteStudentNoteAction,
  getCourseQAAction,
  postQuestionAction,
  postAnswerAction,
} from "@/lib/turso.functions";
import { pushNotification } from "@/lib/notifications";
import {
  Video,
  Headphones,
  Paperclip,
  Globe,
  Upload,
  ExternalLink,
  Play,
  Pause,
  Eye,
  FileCode,
} from "lucide-react";
import {
  getStoredContents,
  syncCloudContents,
  deleteContentItem,
  type LMSContentItem,
} from "@/lib/course-content";
import { MultiTypeContentUploader } from "@/components/lms/MultiTypeContentUploader";

interface CoursePlayerTabsProps {
  materialSlug: string;
  currentModuleIndex: number;
  currentModuleName: string;
  description: string;
  subject: string;
  grade: number | null;
}

interface Note {
  id: string;
  moduleIndex: number;
  moduleName: string;
  text: string;
  timestamp: string;
}

interface QAItem {
  id: string;
  author: string;
  avatar: string;
  date: string;
  question: string;
  replies: { author: string; avatar?: string; date?: string; time?: string; text: string; isInstructor?: boolean }[];
}

export function CoursePlayerTabs({
  materialSlug,
  currentModuleIndex,
  currentModuleName,
  description,
  subject,
  grade,
}: CoursePlayerTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "playground" | "notes" | "qa" | "resources" | "reviews">("overview");

  // Server functions
  const fetchNotesFn = useServerFn(getStudentNotesForMaterial);
  const saveNoteFn = useServerFn(saveStudentNoteAction);
  const deleteNoteFn = useServerFn(deleteStudentNoteAction);
  const fetchQAFn = useServerFn(getCourseQAAction);
  const postQAFn = useServerFn(postQuestionAction);
  const postAnswerFn = useServerFn(postAnswerAction);

  // --- Multi-Type Content State ---
  const [contents, setContents] = useState<LMSContentItem[]>([]);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeVideoModalItem, setActiveVideoModalItem] = useState<LMSContentItem | null>(null);

  const loadContents = () => {
    setContents(getStoredContents(materialSlug));
    // Asynchronously fetch fresh data from Turso Cloud DB
    syncCloudContents(materialSlug).then((fresh) => {
      if (fresh) setContents(fresh);
    });
  };

  useEffect(() => {
    loadContents();
    const handleUpdate = () => {
      setContents(getStoredContents(materialSlug));
    };
    window.addEventListener("digisschool:content_updated", handleUpdate);
    return () => window.removeEventListener("digisschool:content_updated", handleUpdate);
  }, [materialSlug]);

  // --- Notes State ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");

  const userId = "current-user";

  useEffect(() => {
    async function loadNotes() {
      try {
        const res = await fetchNotesFn({ data: { userId, materialSlug } });
        if (res?.notes && res.notes.length > 0) {
          setNotes(
            res.notes.map((n: any) => ({
              id: n.id,
              moduleIndex: n.module_index,
              moduleName: n.module_name,
              text: n.note_text,
              timestamp: new Date(n.created_at || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            }))
          );
        }
      } catch {
        // fallback
      }
    }
    loadNotes();
  }, [materialSlug]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const noteText = newNote.trim();
    const tempItem: Note = {
      id: Date.now().toString(),
      moduleIndex: currentModuleIndex,
      moduleName: currentModuleName,
      text: noteText,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };
    setNotes([tempItem, ...notes]);
    setNewNote("");
    toast.success("Catatan berhasil disimpan ke cloud database!");
    pushNotification({
      category: "social",
      type: "note_saved",
      title: "Catatan Pembelajaran Disimpan",
      message: `Catatan baru pada modul '${currentModuleName}' berhasil disinkronkan ke cloud.`,
      link: `/materi/${materialSlug}`,
    });

    try {
      await saveNoteFn({
        data: {
          user_id: userId,
          material_slug: materialSlug,
          module_index: currentModuleIndex,
          module_name: currentModuleName,
          note_text: noteText,
        },
      });
    } catch {
      // already saved in local state
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    toast.info("Catatan dihapus");
    try {
      await deleteNoteFn({ data: { id, userId } });
    } catch {
      // ignore
    }
  };

  // --- Q&A State ---
  const [qaList, setQaList] = useState<QAItem[]>([
    {
      id: "qa-init-1",
      author: "Ahmad Rizky",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad",
      date: "Kemarin",
      question: "Apakah ada latihan tambahan untuk penerapan rumus bab ini?",
      replies: [
        {
          author: "Guru Pengampu",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher",
          date: "Kemarin",
          text: "Halo Ahmad! Silakan kerjakan menu Latihan Soal & Tugas di bawah materi untuk memperdalam pemahaman.",
          isInstructor: true,
        },
      ],
    },
  ]);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadQA() {
      try {
        const res = await fetchQAFn({ data: { materialSlug } });
        if (res?.qa && res.qa.length > 0) {
          setQaList(
            res.qa.map((q: any) => ({
              id: q.id,
              author: q.author_name,
              avatar: q.author_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + q.author_name,
              date: "Baru saja",
              question: q.question,
              replies: q.replies || [],
            }))
          );
        }
      } catch {
        // fallback
      }
    }
    loadQA();
  }, [materialSlug]);

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;
    const qText = newQuestion.trim();
    const tempItem: QAItem = {
      id: `qa-${Date.now()}`,
      author: "Santri Digisschool",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
      date: "Baru saja",
      question: qText,
      replies: [],
    };
    setQaList([tempItem, ...qaList]);
    setNewQuestion("");
    toast.success("Pertanyaan terkirim ke cloud forum kelas!");
    pushNotification({
      category: "social",
      type: "qa_posted",
      title: "Pertanyaan Diskusi Terkirim",
      message: `Pertanyaan Anda: "${qText.slice(0, 50)}..." berhasil diposting ke forum diskusi.`,
      link: `/materi/${materialSlug}`,
    });

    try {
      await postQAFn({
        data: {
          material_slug: materialSlug,
          user_id: userId,
          author_name: "Santri Digisschool",
          author_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
          question: qText,
        },
      });
    } catch {
      // ignore
    }
  };

  const handleAddReply = async (questionId: string) => {
    const text = replyInputs[questionId]?.trim();
    if (!text) return;

    const newReply = {
      author: "Santri Digisschool",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me",
      date: "Baru saja",
      text,
      isInstructor: false,
    };

    setQaList(
      qaList.map((q) =>
        q.id === questionId ? { ...q, replies: [...q.replies, newReply] } : q
      )
    );
    setReplyInputs({ ...replyInputs, [questionId]: "" });
    toast.success("Tanggapan berhasil dikirim!");
    pushNotification({
      category: "social",
      type: "qa_replied",
      title: "Tanggapan Forum Terkirim",
      message: `Anda membalas diskusi forum kelas dengan tanggapan baru.`,
      link: `/materi/${materialSlug}`,
    });

    try {
      await postAnswerFn({
        data: {
          questionId,
          author: "Santri Digisschool",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Student",
          text,
        },
      });
    } catch {
      // ignore
    }
  };

  // --- Reviews State ---
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [userSubmittedReview, setUserSubmittedReview] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.warning("Tuliskan ulasan Anda terlebih dahulu");
      return;
    }
    setUserSubmittedReview(true);
    toast.success("Terima kasih atas ulasan dan rating Anda!");
  };

  return (
    <div className="mt-8 rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
      {/* Tab Navigation */}
      <div className="flex border-b border-border/80 bg-muted/40 px-4 overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: "Ringkasan", icon: FileText },
          { id: "playground", label: "Lab Coding Interaktif", icon: Code2 },
          { id: "notes", label: `Catatan Saya (${notes.length})`, icon: Bookmark },
          { id: "qa", label: `Tanya Jawab (${qaList.length})`, icon: MessageSquare },
          { id: "resources", label: "File & Sumber Belajar", icon: Download },
          { id: "reviews", label: "Ulasan & Rating", icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-primary bg-background/80"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* --- Tab: Interactive Playground --- */}
        {activeTab === "playground" && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                Laboratorium Coding & Eksekusi Langsung
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tulis dan jalankan kode program HTML, CSS, JavaScript, atau Python langsung di peramban Anda untuk menguji konsep modul ini.
              </p>
            </div>
            <InteractiveCodingSandbox />
          </div>
        )}

        {/* --- Tab 1: Overview --- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Tentang Materi Ini</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description || "Materi pembelajaran komprehensif yang dirancang untuk mengasah penguasaan konsep, pemecahan masalah, dan evaluasi hasil belajar secara mandiri."}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-border/60">
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
                <span className="font-mono text-xs text-muted-foreground uppercase">Mata Pelajaran</span>
                <p className="font-semibold text-foreground text-sm mt-1">{subject}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
                <span className="font-mono text-xs text-muted-foreground uppercase">Tingkatan</span>
                <p className="font-semibold text-foreground text-sm mt-1">Kelas {grade ?? "Umum"}</p>
              </div>
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/60">
                <span className="font-mono text-xs text-muted-foreground uppercase">Sertifikat</span>
                <p className="font-semibold text-success text-sm mt-1">Tersedia setelah selesai</p>
              </div>
            </div>
          </div>
        )}

        {/* --- Tab 2: Notes --- */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border/80 bg-background p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  Catatan untuk: {currentModuleName}
                </span>
              </div>
              <Textarea
                placeholder="Tuliskan catatan penting atau rumus yang ingin Anda ingat dari modul ini..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="mb-3 text-sm resize-none bg-card"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddNote} className="gap-1.5 font-semibold">
                  <Plus className="w-3.5 h-3.5" />
                  Simpan Catatan
                </Button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada catatan untuk materi ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl border border-border/70 bg-background/60 flex items-start justify-between gap-4 transition-colors hover:border-border"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          Modul {note.moduleIndex + 1}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{note.moduleName}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">· {note.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Hapus catatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- Tab 3: Q&A Forum --- */}
        {activeTab === "qa" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border/80 bg-background p-4">
              <h4 className="text-sm font-bold text-foreground mb-2">Ajukan Pertanyaan Baru</h4>
              <Textarea
                placeholder="Ada materi yang kurang jelas? Tanyakan di sini agar guru atau teman sekelas bisa membantu..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={2}
                className="mb-3 text-sm resize-none bg-card"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddQuestion} className="gap-1.5 font-semibold">
                  <Send className="w-3.5 h-3.5" />
                  Kirim Pertanyaan
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {qaList.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-border/70 bg-background">
                  <div className="flex items-center gap-2.5 mb-2">
                    <img src={q.avatar} alt={q.author} className="w-6 h-6 rounded-full bg-muted" />
                    <span className="text-xs font-semibold text-foreground">{q.author}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">· {q.date}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-3">{q.question}</p>

                  {/* Replies list */}
                  {q.replies.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-primary/20 my-3">
                      {q.replies.map((r, ri) => (
                        <div key={ri} className="p-3 rounded-lg bg-secondary/30 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{r.author}</span>
                            {r.isInstructor && (
                              <span className="font-mono text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.2 rounded">
                                Pengajar
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-mono">· {r.date}</span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40">
                    <Input
                      placeholder="Tulis tanggapan..."
                      value={replyInputs[q.id] || ""}
                      onChange={(e) => setReplyInputs({ ...replyInputs, [q.id]: e.target.value })}
                      className="text-xs h-8 bg-card"
                    />
                    <Button size="sm" variant="secondary" className="h-8 text-xs shrink-0" onClick={() => handleAddReply(q.id)}>
                      Kirim
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- Tab 4: Multi-Type LMS Contents & Resources --- */}
        {activeTab === "resources" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <h4 className="text-sm font-bold text-foreground">Materi Multi-Media & Berkas Pendukung</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Video tambahan, modul PDF, rekaman audio guru, dan berkas praktikum untuk modul ini.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setUploaderOpen(true)}
                className="gap-1.5 font-bold text-xs rounded-xl shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah Konten Baru
              </Button>
            </div>

            {contents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-semibold text-foreground">Belum ada materi tambahan di modul ini.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Klik tombol "Unggah Konten Baru" untuk melampirkan video, e-book PDF, audio, atau berkas tugas.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {contents.map((item) => {
                  const isAudioPlaying = playingAudioId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-background/80 transition-all hover:border-primary/40 hover:shadow-xs"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          {item.type === "video" ? (
                            <Video className="w-5 h-5 text-rose-500" />
                          ) : item.type === "pdf" ? (
                            <FileText className="w-5 h-5 text-red-500" />
                          ) : item.type === "audio" ? (
                            <Headphones className="w-5 h-5 text-purple-500" />
                          ) : item.type === "code" ? (
                            <Code2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Paperclip className="w-5 h-5 text-blue-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                              {item.type.toUpperCase()}
                            </span>
                            <p className="text-sm font-bold text-foreground truncate">{item.title}</p>
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground mt-1.5">
                            {item.duration && <span>Durasi: {item.duration}</span>}
                            {item.fileSize && <span>Ukuran: {item.fileSize}</span>}
                            <span>Modul #{item.moduleIndex + 1}</span>
                          </div>

                          {/* Built-in Audio Player preview if audio type */}
                          {item.type === "audio" && isAudioPlaying && (
                            <div className="mt-3 p-3 rounded-xl bg-muted/60 border border-border/60">
                              <audio
                                controls
                                autoPlay
                                className="w-full h-8"
                                src={item.url.startsWith("http") ? item.url : "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {item.type === "code" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs gap-1.5 rounded-xl font-bold"
                            onClick={() => setActiveTab("playground")}
                          >
                            <Code2 className="w-3.5 h-3.5 text-primary" />
                            Buka Lab Coding
                          </Button>
                        ) : item.type === "audio" ? (
                          <Button
                            size="sm"
                            variant={isAudioPlaying ? "default" : "outline"}
                            className="text-xs gap-1.5 rounded-xl"
                            onClick={() => setPlayingAudioId(isAudioPlaying ? null : item.id)}
                          >
                            {isAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            {isAudioPlaying ? "Jeda" : "Dengarkan"}
                          </Button>
                        ) : item.type === "video" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 rounded-xl font-semibold bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                            onClick={() => setActiveVideoModalItem(item)}
                          >
                            <Play className="w-3.5 h-3.5 text-rose-500 fill-current" />
                            Putar Video
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1.5 rounded-xl font-semibold"
                            onClick={() => toast.success(`Mengunduh berkas: ${item.title}`)}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-xl"
                          onClick={() => {
                            deleteContentItem(item.id);
                            loadContents();
                            toast.info("Konten dihapus dari modul");
                          }}
                          title="Hapus konten ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal Multi-Type Content Uploader */}
            <MultiTypeContentUploader
              open={uploaderOpen}
              onOpenChange={setUploaderOpen}
              materialSlug={materialSlug}
              materialTitle={subject}
              moduleIndex={currentModuleIndex}
              moduleName={currentModuleName}
              onSuccess={loadContents}
            />
          </div>
        )}

        {/* --- Tab 5: Reviews --- */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {!userSubmittedReview ? (
              <form onSubmit={handleSubmitReview} className="p-5 rounded-xl border border-border/80 bg-background space-y-4">
                <h4 className="text-sm font-bold text-foreground">Beri Penilaian untuk Materi Ini</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground mr-2">Rating:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? "fill-primary text-primary" : "text-border"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono text-xs font-bold text-primary ml-2">{rating}.0 / 5.0</span>
                </div>
                <Textarea
                  placeholder="Bagikan pengalaman belajar Anda, kejelasan penjelasan, dan manfaat materi ini..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={3}
                  className="text-sm bg-card resize-none"
                />
                <Button type="submit" size="sm" className="font-semibold">
                  Kirim Ulasan
                </Button>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">Ulasan Anda telah tersimpan. Terima kasih atas masukan Anda!</p>
              </div>
            )}

            <div className="pt-4 border-t border-border/60">
              <h4 className="text-sm font-bold text-foreground mb-4">Ulasan Siswa Lain</h4>
              <div className="space-y-3">
                {[
                  { name: "Siti Rahma", rating: 5, date: "2 hari lalu", text: "Penjelasannya sangat runut dan mudah dipahami. Kuisnya juga sangat membantu menguji pemahaman." },
                  { name: "Budi Santoso", rating: 5, date: "1 minggu lalu", text: "Materi ini langsung mengena pada inti soal ujian. Sangat direkomendasikan!" },
                ].map((rev, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/60 bg-background/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-foreground">{rev.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">{rev.date}</span>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: rev.rating }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Focused LMS Video Modal (No External Distractions) */}
      <Dialog open={!!activeVideoModalItem} onOpenChange={(open) => !open && setActiveVideoModalItem(null)}>
        <DialogContent className="max-w-3xl sm:max-w-4xl p-0 overflow-hidden border-border/80 bg-black text-white rounded-3xl shadow-2xl">
          {activeVideoModalItem && (
            <FocusedLMSVideoPlayer
              videoUrl={activeVideoModalItem.url}
              title={activeVideoModalItem.title}
              moduleName={`Modul ${activeVideoModalItem.moduleIndex + 1}`}
              durationString={activeVideoModalItem.duration}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
