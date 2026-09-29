import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { text: string; label: string; lang: string; onClose: () => void };

export function SpeechPlayer({ text, label, lang, onClose }: Props) {
  const duration = Math.max(1, Math.ceil(text.length / 13));
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<number | null>(null);

  const speakFrom = (seconds: number) => {
    window.speechSynthesis.cancel();
    const offset = Math.floor((seconds / duration) * text.length);
    const utterance = new SpeechSynthesisUtterance(text.slice(offset));
    utterance.lang = lang === "auto" ? "en-US" : lang;
    utterance.rate = 1;
    utterance.onend = () => { setPlaying(false); setElapsed(duration); };
    utterance.onerror = () => setPlaying(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  useEffect(() => {
    if (duration <= 10) { onClose(); return; }
    speakFrom(0);
    timerRef.current = window.setInterval(() => setElapsed((value) => Math.min(duration, value + 1)), 1000);
    const closeTimer = window.setTimeout(onClose, (duration + 10) * 1000);
    return () => {
      window.speechSynthesis.cancel();
      if (timerRef.current) window.clearInterval(timerRef.current);
      window.clearTimeout(closeTimer);
    };
  }, [text]);

  const toggle = () => {
    if (playing) { window.speechSynthesis.pause(); setPlaying(false); }
    else { window.speechSynthesis.resume(); setPlaying(true); }
  };

  return (
    <div data-translation-ui="" className="fixed inset-x-1/2 bottom-4 z-[55] flex w-[min(94vw,40rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-[var(--header)]/95 px-3 py-2 text-white shadow-[var(--shadow-float)] backdrop-blur-xl" dir="ltr">
      <Button variant="ghost" size="icon-sm" aria-label="Rewind" onClick={() => { const next = Math.max(0, elapsed - 5); setElapsed(next); speakFrom(next); }}><SkipBack className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
      <input aria-label={`${label} playback position`} className="min-w-0 flex-1 accent-[var(--accent)]" type="range" min={0} max={duration} value={elapsed} onChange={(event) => { const next = Number(event.target.value); setElapsed(next); speakFrom(next); }} />
      <span className="w-20 text-center text-[11px] tabular-nums text-white/70">{elapsed}s / {duration}s</span>
      <Button variant="ghost" size="icon-sm" aria-label="Forward" onClick={() => { const next = Math.min(duration, elapsed + 5); setElapsed(next); speakFrom(next); }}><SkipForward className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Close player" onClick={onClose}><X className="size-4" /></Button>
    </div>
  );
}

export default SpeechPlayer;
