import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Tv,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface FocusedLMSVideoPlayerProps {
  videoUrl: string;
  title: string;
  moduleName?: string;
  thumbnailUrl?: string;
  durationString?: string;
  onCompleted?: () => void;
  onProgress?: (percent: number, currentTime: number) => void;
}

/**
 * Extracts YouTube Video ID or returns null if it's a direct MP4/video link
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Converts seconds into MM:SS or HH:MM:SS format
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function FocusedLMSVideoPlayer({
  videoUrl,
  title,
  moduleName,
  thumbnailUrl,
  durationString = "18:45",
  onCompleted,
  onProgress,
}: FocusedLMSVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const nativeVideoRef = useRef<HTMLVideoElement>(null);

  const youtubeId = extractYouTubeId(videoUrl);
  const isYouTube = !!youtubeId;

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setup estimated duration from durationString if duration is 0
  useEffect(() => {
    if (duration === 0 && durationString) {
      const parts = durationString.split(":").map(Number);
      if (parts.length === 2) {
        setDuration(parts[0] * 60 + parts[1]);
      } else if (parts.length === 3) {
        setDuration(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      }
    }
  }, [durationString, duration]);

  // Reset start state when videoUrl changes
  useEffect(() => {
    setHasStarted(false);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [videoUrl]);

  // Handle auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  // YouTube postMessage controller helper
  const sendYouTubeCommand = (command: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: "command",
          func: command,
          args: args,
        }),
        "*"
      );
    }
  };

  // Start / Play / Pause Toggle
  const startAndPlay = () => {
    setHasStarted(true);
    setIsPlaying(true);

    if (isYouTube) {
      sendYouTubeCommand("playVideo");
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!hasStarted) {
      startAndPlay();
      return;
    }

    if (isYouTube) {
      if (isPlaying) {
        sendYouTubeCommand("pauseVideo");
        setIsPlaying(false);
      } else {
        sendYouTubeCommand("playVideo");
        setIsPlaying(true);
      }
    } else if (nativeVideoRef.current) {
      if (isPlaying) {
        nativeVideoRef.current.pause();
        setIsPlaying(false);
      } else {
        nativeVideoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Seek +/- 10 Seconds
  const seekRelative = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration || 1000, currentTime + seconds));
    setCurrentTime(newTime);

    if (isYouTube) {
      sendYouTubeCommand("seekTo", [newTime, true]);
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = newTime;
    }
  };

  // Scrubber Seek
  const handleScrubberChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);

    if (isYouTube) {
      sendYouTubeCommand("seekTo", [newTime, true]);
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.currentTime = newTime;
    }
  };

  // Volume Change
  const handleVolumeChange = (value: number[]) => {
    const newVol = value[0];
    setVolume(newVol);
    setIsMuted(newVol === 0);

    if (isYouTube) {
      sendYouTubeCommand("setVolume", [newVol * 100]);
      if (newVol === 0) sendYouTubeCommand("mute");
      else sendYouTubeCommand("unMute");
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.volume = newVol;
      nativeVideoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYouTube) {
      if (nextMuted) sendYouTubeCommand("mute");
      else {
        sendYouTubeCommand("unMute");
        sendYouTubeCommand("setVolume", [volume * 100]);
      }
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.muted = nextMuted;
    }
  };

  // Playback Rate
  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);

    if (isYouTube) {
      sendYouTubeCommand("setPlaybackRate", [nextRate]);
    } else if (nativeVideoRef.current) {
      nativeVideoRef.current.playbackRate = nextRate;
    }
    toast.info(`Kecepatan putar: ${nextRate}x`);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Periodic progress tracker timer for video progress
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && hasStarted) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + playbackRate;
          const maxDur = duration || 1200;
          const percent = Math.min(100, Math.round((next / maxDur) * 100));

          onProgress?.(percent, next);

          // Check if student completed 90%+ of video
          if (percent >= 90 && !isCompleted) {
            setIsCompleted(true);
            onCompleted?.();
            toast.success("🏆 Selamat! Anda telah menyelesaikan materi video pembelajaran ini (+50 XP)!");
          }

          if (next >= maxDur) {
            setIsPlaying(false);
            return maxDur;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, hasStarted, playbackRate, duration, isCompleted, onCompleted, onProgress]);

  // YouTube High-Compatibility URL:
  // Using standard embed with autoplay when started, modestbranding, rel=0, playsinline=1, no-cookie fallback
  const cleanYouTubeUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?autoplay=${hasStarted ? 1 : 0}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1`
    : "";

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full aspect-[16/9] rounded-3xl overflow-hidden bg-black border border-border/80 shadow-2xl select-none group ${
        isFullscreen ? "rounded-none h-screen" : ""
      }`}
    >
      {/* 1. Underlying Video Render: YouTube Clean Embed or Native Video */}
      {isYouTube ? (
        hasStarted ? (
          <div className="absolute inset-0 overflow-hidden">
            <iframe
              ref={iframeRef}
              src={cleanYouTubeUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div
            onClick={startAndPlay}
            className="absolute inset-0 cursor-pointer bg-zinc-950 flex items-center justify-center group/poster"
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={title}
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover/poster:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          </div>
        )
      ) : (
        <video
          ref={nativeVideoRef}
          src={videoUrl}
          poster={thumbnailUrl}
          playsInline
          className="w-full h-full object-contain"
          onTimeUpdate={() => {
            if (nativeVideoRef.current) {
              setCurrentTime(nativeVideoRef.current.currentTime);
              setDuration(nativeVideoRef.current.duration || duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setIsCompleted(true);
            onCompleted?.();
          }}
        />
      )}

      {/* 2. Top Header Bar: Clean LMS Focus Mode Badge */}
      <div
        className={`absolute top-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between z-20 transition-all duration-300 pointer-events-none ${
          showControls || !hasStarted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
      >
        <div className="flex items-center gap-2.5 max-w-[75%]">
          <Badge className="bg-primary/90 text-primary-foreground font-mono text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/40 shadow-sm flex items-center gap-1.5 shrink-0">
            <Tv className="w-3 h-3" /> Player Fokus Santri
          </Badge>
          <span className="text-white text-xs sm:text-sm font-semibold truncate drop-shadow-md">
            {moduleName ? `${moduleName}: ` : ""} {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tuntas
            </Badge>
          )}
          <span className="font-mono text-[11px] text-slate-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 hidden sm:inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bebas Distraksi
          </span>
        </div>
      </div>

      {/* 3. Center Big Play Button (when not started yet) */}
      {!hasStarted && (
        <div
          onClick={startAndPlay}
          className="absolute inset-0 flex flex-col items-center justify-center z-20 cursor-pointer pointer-events-auto"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 group/btn">
            <Play className="w-8 h-8 sm:w-9 h-9 fill-current ml-1 transform group-hover/btn:scale-105 transition-transform" />
          </div>
          <p className="mt-4 text-xs sm:text-sm font-semibold text-white/90 bg-black/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
            Klik untuk Mulai Belajar 🚀
          </p>
        </div>
      )}

      {/* 4. Bottom Unified LMS Video Controller Bar (when not started or when playing) */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 transition-all duration-300 ${
          showControls || !hasStarted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Slider */}
        <div className="mb-3 group/scrub">
          <div className="relative flex items-center">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleScrubberChange}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-2 text-white">
          {/* Left Controls: Play/Pause, Rewind, Forward, Time, Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title={isPlaying ? "Jeda" : "Putar"}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Mundur 10 Detik"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Maju 10 Detik"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Current Time / Duration Display */}
            <span className="font-mono text-[11px] sm:text-xs text-white/90 font-medium ml-1">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration || 1125)}
            </span>

            {/* Volume Controller */}
            <div className="hidden md:flex items-center gap-1.5 ml-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                title={isMuted ? "Bunyikan Suara" : "Bisukan Suara"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-16 sm:w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.05}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Controls: Speed, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={cyclePlaybackRate}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] sm:text-xs font-bold transition-colors"
              title="Ubah Kecepatan Video"
            >
              {playbackRate}x
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
