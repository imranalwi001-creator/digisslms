import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useSiteSettings, useSiteAssets } from "@/lib/site-settings";
import { HallmarkButton } from "@/components/ui/hallmark-button";

const SLIDE_MS = 6000;

export function HeroBanner() {
  const { settings } = useSiteSettings();
  const slides = settings.heroSlides;
  const images = useSiteAssets(slides.map((s) => s.image));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex((next + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  const active = slides[Math.min(index, slides.length - 1)] ?? slides[0];

  return (
    <section
      className="relative overflow-hidden pb-20 pt-0 lg:pb-28 lg:pt-8 bg-zinc-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
      aria-label="Banner Digisschool LMS"
    >
      {/* Slides — crossfade + Ken Burns */}
      {slides.map((s, i) => (
        <div
          key={`${s.image}-${i}`}
          className="absolute inset-0 pointer-events-none transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: i === index ? 0.35 : 0 }}
          aria-hidden={i !== index}
        >
          <img
            src={images[i] ?? s.image}
            alt=""
            width={1920}
            height={1088}
            loading={i === 0 ? "eager" : "lazy"}
            className={`w-full h-full object-cover object-center select-none ${i === index ? "animate-ken-burns" : ""}`}
          />
        </div>
      ))}

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40" />

      {/* Slide copy */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 pt-32 pb-8 sm:pt-36">
        <div key={index} className="max-w-2xl animate-banner-text">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">{active.kicker}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.08]">
            {active.titleLine1}<br />
            <span className="text-primary">{active.titleLine2}</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-zinc-300 max-w-xl leading-relaxed">
            {active.desc}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
            <Link to="/login">
              <HallmarkButton size="lg" className="px-7 shadow-lg shadow-primary/20">
                {active.cta}
                <ArrowRight className="w-4 h-4 ml-1" />
              </HallmarkButton>
            </Link>
            <Link to="/" hash="courses">
              <HallmarkButton variant="outline" size="lg" className="border-zinc-700 bg-zinc-900/60 text-white hover:bg-zinc-800">
                Jelajahi Kurikulum
              </HallmarkButton>
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center justify-between gap-5 border-t border-zinc-800/80 pt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => go(index - 1)}
              aria-label="Banner sebelumnya"
              className="w-9 h-9 rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-200 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all duration-200 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Banner berikutnya"
              className="w-9 h-9 rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-200 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all duration-200 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-1 max-w-[240px]">
            {slides.map((s, i) => (
              <button
                key={`dot-${i}`}
                onClick={() => go(i)}
                aria-label={`Ke banner ${i + 1}`}
                aria-current={i === index}
                className="group relative h-[3px] flex-1 rounded-full bg-zinc-700 overflow-hidden"
              >
                <span
                  className={`absolute inset-0 bg-primary rounded-full ${i === index && !paused ? "animate-slider-progress" : ""}`}
                  style={{
                    ["--slider-duration" as string]: `${SLIDE_MS}ms`,
                    transform: i === index && paused ? "scaleX(1)" : i === index ? undefined : "scaleX(0)",
                    transformOrigin: "left center",
                  }}
                />
              </button>
            ))}
            <span className="font-mono text-xs text-zinc-400 tabular-nums pl-2">
              {String(index + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
