import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Send,
  Code,
  Link2,
  Smile,
  Hash,
  Users,
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Flame,
  ThumbsUp,
  Heart,
  Bot,
  User,
  GraduationCap,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getChatMessages,
  getAllChannels,
  sendChatMessage,
  addMessageReaction,
  type ChatMessage,
  type ChatChannel,
  type ChatMessageType,
} from "@/lib/chat";
import { formatDate } from "@/lib/lms";
import { useAuth } from "@/hooks/use-auth";

interface StudentChatHubProps {
  userId: string;
  userGrade?: number | null;
  initialChannelId?: string;
  targetPeer?: {
    id: string;
    name: string;
    avatar?: string | null;
    grade?: number | null;
  };
}

const EMOJI_REACTIONS = ["👍", "🔥", "🚀", "💡", "❤️", "👏"];

export function StudentChatHub({
  userId,
  userGrade,
  initialChannelId,
  targetPeer,
}: StudentChatHubProps) {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>(getAllChannels());
  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialChannelId || (userGrade ? `kelas-${userGrade}` : "kelas-8")
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [messageType, setMessageType] = useState<ChatMessageType>("text");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If a direct peer was targeted
  useEffect(() => {
    if (targetPeer && targetPeer.id !== userId) {
      const dmChannelId = `dm-${[userId, targetPeer.id].sort().join("-")}`;
      const existing = channels.find((c) => c.id === dmChannelId);
      if (!existing) {
        const directChan: ChatChannel = {
          id: dmChannelId,
          name: `💬 ${targetPeer.name}`,
          description: `Obrolan santri 1-on-1 dengan ${targetPeer.name} (Kelas ${targetPeer.grade ?? "-"})`,
          category: "direct",
          peerUser: {
            id: targetPeer.id,
            name: targetPeer.name,
            avatar: targetPeer.avatar,
            grade: targetPeer.grade,
            isOnline: true,
          },
        };
        setChannels((prev) => [directChan, ...prev]);
      }
      setActiveChannelId(dmChannelId);
    }
  }, [targetPeer, userId]);

  // Load channel messages
  const loadMessages = () => {
    const list = getChatMessages(activeChannelId);
    setMessages(list);
  };

  useEffect(() => {
    loadMessages();
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannelId]);

  // Event listener for real-time incoming messages & reactions
  useEffect(() => {
    const handleNewMessage = (e: any) => {
      const msg: ChatMessage = e.detail;
      if (msg.channelId === activeChannelId) {
        setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };

    const handleReaction = (e: any) => {
      loadMessages();
    };

    window.addEventListener("digisschool:chat_message", handleNewMessage);
    window.addEventListener("digisschool:chat_reaction", handleReaction);

    return () => {
      window.removeEventListener("digisschool:chat_message", handleNewMessage);
      window.removeEventListener("digisschool:chat_reaction", handleReaction);
    };
  }, [activeChannelId]);

  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || channels[0];
  }, [channels, activeChannelId]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    return channels.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [channels, searchQuery]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text && !codeSnippet.trim() && !linkUrl.trim()) return;

    const senderName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Santri Digisschool";
    const senderAvatar = user?.user_metadata?.avatar_url || null;

    let contentToSend = text;
    let linkData: { title: string; url: string } | undefined = undefined;

    if (messageType === "code" && codeSnippet.trim()) {
      contentToSend = text || "Berikut potongan kode saya:";
    } else if (messageType === "link" && linkUrl.trim()) {
      linkData = {
        title: linkTitle.trim() || "Tautan Proyek",
        url: linkUrl.trim(),
      };
      contentToSend = text || `Silakan cek proyek ini: ${linkData.title}`;
    }

    sendChatMessage({
      senderId: userId,
      senderName,
      senderAvatar,
      senderGrade: userGrade,
      channelId: activeChannelId,
      content: contentToSend,
      type: messageType,
      codeLanguage: messageType === "code" ? codeLanguage : undefined,
      linkPreview: linkData,
    });

    setInputText("");
    setCodeSnippet("");
    setLinkUrl("");
    setLinkTitle("");
    setMessageType("text");
    loadMessages();
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Kode berhasil disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReactionClick = (msgId: string, emoji: string) => {
    addMessageReaction(msgId, emoji);
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm grid lg:grid-cols-[300px_1fr] h-[720px] max-h-[82vh]">
      {/* SIDEBAR: Channels & Direct Messages */}
      <div className="border-r border-border/70 bg-muted/20 flex flex-col h-full overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Ruang Diskusi</h3>
                <p className="text-[11px] font-mono text-muted-foreground">Komunitas Santri Digisschool</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 text-success border-success/30">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Online
            </Badge>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari forum & topik..."
              className="rounded-xl text-xs pl-8 h-8 bg-background"
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {/* Forum Jenjang Kelas */}
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase px-2 tracking-wider">
              Forum Jenjang Kelas
            </p>
            {filteredChannels
              .filter((c) => c.category === "grade")
              .map((c) => {
                const isActive = c.id === activeChannelId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    {c.grade === userGrade && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                        }`}
                      >
                        Kelasmu
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Klub Minat & Portofolio */}
          <div className="space-y-1">
            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase px-2 tracking-wider">
              Klub Minat Coding & Proyek
            </p>
            {filteredChannels
              .filter((c) => c.category === "club")
              .map((c) => {
                const isActive = c.id === activeChannelId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
          </div>

          {/* Direct Messages */}
          {filteredChannels.some((c) => c.category === "direct") && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase px-2 tracking-wider">
                Pesan Langsung Santri (1-on-1)
              </p>
              {filteredChannels
                .filter((c) => c.category === "direct")
                .map((c) => {
                  const isActive = c.id === activeChannelId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="w-2 h-2 rounded-full bg-success" />
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-border/60 bg-card/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Santri"}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground">Kelas {userGrade ?? "-"}</p>
            </div>
          </div>
          <Link
            to="/siswa/$id"
            params={{ id: userId }}
            className="text-[11px] font-mono text-primary font-bold hover:underline"
          >
            Profil
          </Link>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-3.5 border-b border-border/60 bg-card/40 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground truncate">{activeChannel.name}</h2>
              {activeChannel.peerUser && (
                <Badge variant="outline" className="text-[10px] font-mono gap-1 text-primary border-primary/30">
                  <GraduationCap className="w-3 h-3" />
                  Kelas {activeChannel.peerUser.grade ?? "-"}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{activeChannel.description}</p>
          </div>

          {activeChannel.peerUser && (
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1 shrink-0" asChild>
              <Link to="/siswa/$id" params={{ id: activeChannel.peerUser.id }}>
                <User className="w-3.5 h-3.5" />
                Lihat Profil Santri
              </Link>
            </Button>
          )}
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-2 text-primary/30" />
              <p className="text-sm font-bold text-foreground">Belum ada pesan di forum ini</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Jadilah yang pertama menyapa teman sekelas atau membagikan pertanyaan belajar!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                    isMine ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-border">
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      msg.senderName.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Message Body */}
                  <div className={`space-y-1 min-w-0 ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">{msg.senderName}</span>
                      {msg.senderGrade && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground">
                          Kls {msg.senderGrade}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs space-y-2 leading-relaxed shadow-xs ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card border border-border/80 text-foreground rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>

                      {/* Code Snippet Attachment */}
                      {msg.type === "code" && (
                        <div className="mt-2 rounded-xl bg-black/80 text-emerald-300 p-3 font-mono text-[11px] relative overflow-x-auto border border-emerald-900/50">
                          <div className="flex items-center justify-between pb-1 mb-1 border-b border-emerald-900/40 text-[10px] text-emerald-500">
                            <span>{msg.codeLanguage || "javascript"}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(msg.content, msg.id)}
                              className="hover:text-white transition-colors"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <code>{msg.content}</code>
                        </div>
                      )}

                      {/* Link Preview Attachment */}
                      {msg.linkPreview && (
                        <a
                          href={msg.linkPreview.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`mt-2 block p-2.5 rounded-xl border transition-all ${
                            isMine
                              ? "bg-white/10 border-white/20 hover:bg-white/20 text-white"
                              : "bg-muted/50 border-border hover:bg-primary/10 hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                              {msg.linkPreview.title}
                            </span>
                            <ExternalLink className="w-3 h-3 opacity-70 shrink-0 ml-1" />
                          </div>
                          <p className="text-[10px] font-mono opacity-80 truncate mt-0.5">
                            {msg.linkPreview.url}
                          </p>
                        </a>
                      )}
                    </div>

                    {/* Reactions Bar */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {msg.reactions &&
                        Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(msg.id, emoji)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/80 text-[10px] hover:bg-secondary border border-border cursor-pointer transition-colors"
                          >
                            <span>{emoji}</span>
                            <span className="font-mono font-bold text-foreground">{count}</span>
                          </button>
                        ))}

                      {/* Quick Emoji Trigger */}
                      <div className="inline-flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                        {EMOJI_REACTIONS.slice(0, 3).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleReactionClick(msg.id, emoji)}
                            className="text-xs p-1 hover:scale-125 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* MESSAGE COMPOSER BAR */}
        <div className="p-3 sm:p-4 border-t border-border/60 bg-card/60 space-y-2">
          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setMessageType("text")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                messageType === "text"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              💬 Pesan Teks
            </button>
            <button
              type="button"
              onClick={() => setMessageType("code")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                messageType === "code"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Code className="w-3 h-3" />
              Kode Koding
            </button>
            <button
              type="button"
              onClick={() => setMessageType("link")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                messageType === "link"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Link2 className="w-3 h-3" />
              Tautan Proyek
            </button>
          </div>

          {/* Code Mode Inputs */}
          {messageType === "code" && (
            <div className="p-3 rounded-xl border border-border bg-background space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">Bahasa Pemrograman:</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="h-7 px-2 rounded-lg border text-xs bg-card"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML & CSS</option>
                  <option value="sql">SQL Query</option>
                </select>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Tempel / ketik kode program Anda di sini..."
                rows={3}
                className="w-full p-2.5 rounded-lg border font-mono text-xs bg-muted/30 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Link Mode Inputs */}
          {messageType === "link" && (
            <div className="p-3 rounded-xl border border-border bg-background space-y-2 animate-fade-in">
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Judul Proyek (Contoh: Web Kasir Santri Vercel)"
                className="rounded-lg text-xs h-8"
              />
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://proyek-saya.vercel.app atau https://github.com/..."
                className="rounded-lg text-xs h-8 font-mono"
              />
            </div>
          )}

          {/* Main Input Bar */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tulis pesan di ${activeChannel.name}...`}
              className="rounded-2xl text-xs bg-background h-10 flex-1 shadow-xs"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-2xl h-10 px-4 font-bold text-xs gap-1.5 shadow-md shadow-primary/20 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
