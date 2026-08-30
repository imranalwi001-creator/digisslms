export type ChatMessageType = "text" | "code" | "link";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderGrade?: number | null;
  channelId: string; // e.g. "kelas-7", "kelas-8", "kelas-9", "club-coding", "club-ai", "dm-<userId1>-<userId2>"
  content: string;
  type: ChatMessageType;
  codeLanguage?: string;
  linkPreview?: {
    title: string;
    url: string;
  };
  reactions?: Record<string, number>; // emoji -> count
  createdAt: string;
};

export type ChatChannel = {
  id: string;
  name: string;
  description: string;
  category: "grade" | "club" | "direct";
  grade?: number;
  unreadCount?: number;
  peerUser?: {
    id: string;
    name: string;
    avatar?: string | null;
    grade?: number | null;
    isOnline?: boolean;
  };
};

const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: "kelas-7",
    name: "🏛️ Forum Kelas 7 SMP",
    description: "Ruang diskusi umum mata pelajaran Informatika Kelas 7 Fase D.",
    category: "grade",
    grade: 7,
  },
  {
    id: "kelas-8",
    name: "🏛️ Forum Kelas 8 SMP",
    description: "Ruang diskusi umum mata pelajaran Informatika Kelas 8 Fase D.",
    category: "grade",
    grade: 8,
  },
  {
    id: "kelas-9",
    name: "🏛️ Forum Kelas 9 SMP",
    description: "Ruang diskusi umum mata pelajaran Informatika Kelas 9 Fase D.",
    category: "grade",
    grade: 9,
  },
  {
    id: "club-coding",
    name: "💻 Klub Web & Coding",
    description: "Berbagi kode HTML, CSS, JavaScript, dan pamer portofolio web.",
    category: "club",
  },
  {
    id: "club-ai",
    name: "🤖 Klub Python & AI",
    description: "Eksplorasi kecerdasan buatan, algoritma machine learning, dan logika Python.",
    category: "club",
  },
  {
    id: "tanya-tugas",
    name: "📝 Tanya PR & Solusi Tugas",
    description: "Bantuan dan diskusi sesama santri untuk menyelesaikan tugas mingguan.",
    category: "club",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    senderId: "bot-ustadz",
    senderName: "Ust. Ahmad Dahlan, S.Kom",
    senderGrade: null,
    channelId: "kelas-8",
    content: "Ahlan wa sahlan para santri kelas 8! Jangan lupa modul Algoritma & Pemrograman sudah bisa diakses. Jika ada kendala koding, silakan diskusikan di sini ya.",
    type: "text",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    reactions: { "👍": 4, "🔥": 2 },
  },
  {
    id: "msg-2",
    senderId: "sample-student-1",
    senderName: "Fatih Al-Faruq",
    senderGrade: 8,
    channelId: "kelas-8",
    content: "Ustadz, saya sudah menyelesaikan tugas membuat logika percabangan if-else di JavaScript. Ini kodenya:",
    type: "code",
    codeLanguage: "javascript",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "msg-3",
    senderId: "sample-student-2",
    senderName: "Aisyah Nurul",
    senderGrade: 8,
    channelId: "kelas-8",
    content: "Keren Fatih! Aku juga sudah coba jalankan di sandbox in-browser, hasilnya langsung hijau lolos test case 🚀",
    type: "text",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reactions: { "👏": 3 },
  },
  {
    id: "msg-4",
    senderId: "sample-student-3",
    senderName: "Zaid bin Harits",
    senderGrade: 8,
    channelId: "club-coding",
    content: "Teman-teman, saya baru saja publish proyek aplikasi kasir santri di Vercel, silakan dicoba ya!",
    type: "link",
    linkPreview: {
      title: "Demo Web Kasir Santri",
      url: "https://kasir-santri-demo.vercel.app",
    },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    reactions: { "🚀": 5, "⭐": 3 },
  },
];

const CHAT_STORAGE_KEY = "digisschool_chat_messages_v1";

// Broadcast channel for multi-tab sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel("digisschool_chat_channel");
  } catch {}
}

export function getChatMessages(channelId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const all: ChatMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    return all.filter((m) => m.channelId === channelId);
  } catch {
    return INITIAL_MESSAGES.filter((m) => m.channelId === channelId);
  }
}

export function getAllChannels(): ChatChannel[] {
  return DEFAULT_CHANNELS;
}

export function getDirectChannelId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

export function sendChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
  const newMsg: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    reactions: {},
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      const all: ChatMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
      all.push(newMsg);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(all));

      // Broadcast to other tabs & dispatch local event
      broadcastChannel?.postMessage({ type: "NEW_MESSAGE", message: newMsg });
      window.dispatchEvent(new CustomEvent("digisschool:chat_message", { detail: newMsg }));
    } catch (err) {
      console.warn("Failed to store chat message:", err);
    }
  }

  return newMsg;
}

export function addMessageReaction(messageId: string, emoji: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    const all: ChatMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    const msg = all.find((m) => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(all));

      broadcastChannel?.postMessage({ type: "REACTION_ADDED", messageId, emoji });
      window.dispatchEvent(new CustomEvent("digisschool:chat_reaction", { detail: { messageId, emoji } }));
    }
  } catch (err) {
    console.warn("Failed to add reaction:", err);
  }
}
