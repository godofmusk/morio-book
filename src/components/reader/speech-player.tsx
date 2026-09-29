import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { synthesizeSpeech } from "@/lib/edge-tts";

type Props = { text: string; label: string; lang: string; onClose: () => void };

export function SpeechPlayer({ text, label, lang, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setAudioUrl(null);
    setDuration(0);
    setElapsed(0);
    setPlaying(false);
    setError(null);
    void synthesizeSpeech({ data: { text, language: lang === "auto" ? "en" : lang } }).then((result) => {
      if (!active) return;
      if (!result.ok) { setError(result.error); return; }
      setAudioUrl(result.audio);
    }).catch(() => active && setError("پخش صوتی در دسترس نیست."));
    return () => { active = false; if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current); };
  }, [text, lang]);

  useEffect(() => {
    return () => { if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl); };
  }, [audioUrl]);

  const handleLoaded = () => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    setDuration(audio.duration);
    if (audio.duration <= 10) { onClose(); return; }
    void audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const handleEnded = () => {
    setPlaying(false);
    setElapsed(duration);
    closeTimerRef.current = window.setTimeout(onClose, 10_000);
  };
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { void audio.play(); setPlaying(true); } else { audio.pause(); setPlaying(false); }
  };
  const seek = (value: number) => { if (audioRef.current) audioRef.current.currentTime = value; setElapsed(value); };

  if (error) return null;
  if (!audioUrl || duration <= 10) return null;
  return (
    <div data-translation-ui="" className="fixed inset-x-1/2 bottom-4 z-[55] flex w-[min(94vw,40rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-[var(--header)]/95 px-3 py-2 text-white shadow-[var(--shadow-float)] backdrop-blur-xl" dir="ltr">
      <audio ref={audioRef} src={audioUrl} onLoadedMetadata={handleLoaded} onTimeUpdate={() => setElapsed(audioRef.current?.currentTime ?? 0)} onEnded={handleEnded} onError={() => setError("پخش صوتی در دسترس نیست.")} preload="auto" />
      <Button variant="ghost" size="icon-sm" aria-label="Rewind" onClick={() => seek(Math.max(0, elapsed - 5))}><SkipBack className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
      <input aria-label={`${label} playback position`} className="min-w-0 flex-1 accent-[var(--accent)]" type="range" min={0} max={duration} step={0.1} value={elapsed} onChange={(event) => seek(Number(event.target.value))} />
      <span className="w-20 text-center text-[11px] tabular-nums text-white/70">{Math.floor(elapsed)}s / {Math.floor(duration)}s</span>
      <Button variant="ghost" size="icon-sm" aria-label="Forward" onClick={() => seek(Math.min(duration, elapsed + 5))}><SkipForward className="size-4" /></Button>
      <Button variant="ghost" size="icon-sm" aria-label="Close player" onClick={onClose}><X className="size-4" /></Button>
    </div>
  );
}

export default SpeechPlayer;
