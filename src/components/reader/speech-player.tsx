import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { text: string; label: string; lang: string; onClose: () => void };

export function SpeechPlayer({ text, label, lang, onClose }: Props) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    setReady(false);
    setPlaying(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "auto" ? "en-US" : lang;
    utterance.rate = 0.95;
    utterance.onstart = () => { setReady(true); setPlaying(true); };
    utterance.onend = () => { setPlaying(false); onClose(); };
    utterance.onerror = () => { setPlaying(false); setSupported(false); };
    utteranceRef.current = utterance;

    const start = () => synthesis.speak(utterance);
    const timer = window.setTimeout(start, 80);
    return () => {
      window.clearTimeout(timer);
      synthesis.cancel();
      utteranceRef.current = null;
    };
  }, [text, lang, onClose]);

  const toggle = () => {
    const synthesis = window.speechSynthesis;
    if (synthesis.paused) {
      synthesis.resume();
      setPlaying(true);
    } else if (playing) {
      synthesis.pause();
      setPlaying(false);
    } else if (utteranceRef.current) {
      synthesis.resume();
      setPlaying(true);
    }
  };

  if (!supported) return null;
  if (!ready) {
    return (
      <div data-translation-ui="" className="fixed bottom-4 left-1/2 z-[55] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[var(--header)]/95 px-4 py-2 text-xs text-white shadow-[var(--shadow-float)] backdrop-blur-xl" role="status" aria-live="polite">
        <LoaderCircle className="size-4 animate-spin" />
        <span>در حال آماده‌سازی صدا…</span>
      </div>
    );
  }

  return (
    <div data-translation-ui="" className="fixed bottom-4 left-1/2 z-[55] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-[var(--header)]/95 px-3 py-2 text-white shadow-[var(--shadow-float)] backdrop-blur-xl" dir="ltr">
      <Button variant="ghost" size="icon-sm" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
      <span className="max-w-[12rem] truncate text-xs text-white/70" title={label}>{label}</span>
      <Button variant="ghost" size="icon-sm" aria-label="Close player" onClick={() => { window.speechSynthesis.cancel(); onClose(); }}><X className="size-4" /></Button>
    </div>
  );
}

export default SpeechPlayer;
