"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { historicalVoices, type HistoricalVoice } from "../data/historicalVoices";
import { useModalFocus } from "../hooks/useModalFocus";

interface TourPlace { id: string; name: string; country: string; coordinates: readonly [number, number]; }
interface EssentialTourProps {
  places: readonly TourPlace[];
  onEnter: (placeId: string, voiceId: string) => void;
  onClose: () => void;
}

const tourVoiceIds = ["rigveda-one-truth", "plato-examined-life", "du-fu-spring", "rumi-reed", "tagore-without-fear"] as const;

function formatYear(year: number) { return year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`; }

export default function EssentialTour({ places, onEnter, onClose }: EssentialTourProps) {
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const voices = useMemo(() => tourVoiceIds.flatMap((id) => {
    const voice = historicalVoices.find((item) => item.id === id);
    return voice ? [voice] : [];
  }), []);
  const voice: HistoricalVoice = voices[chapter] ?? voices[0];
  const place = places.find(({ id }) => id === voice.placeId);

  const move = (direction: -1 | 1) => setChapter((value) => (value + direction + voices.length) % voices.length);

  useModalFocus(dialogRef, onClose);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setChapter((value) => value === voices.length - 1 ? 0 : value + 1), 12_000);
    return () => window.clearInterval(timer);
  }, [playing, voices.length]);

  return (
    <section ref={dialogRef} tabIndex={-1} className="essential-tour" role="dialog" aria-modal="true" aria-labelledby="essential-tour-title" onKeyDown={(event) => { if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); if (event.key === " ") { event.preventDefault(); setPlaying((value) => !value); } }} onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStartX.current === null) return; const delta = event.changedTouches[0]?.clientX - touchStartX.current; if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1); touchStartX.current = null; }}>
      <div className="essential-tour__years" aria-hidden="true">{voices.map((item, index) => <span key={item.id} className={index === chapter ? "active" : ""}>{item.year}</span>)}</div>
      <header><span>THREE-MINUTE ESSENTIAL JOURNEY</span><strong>时光地球 · 三分钟导览</strong><button type="button" onClick={onClose} aria-label="退出三分钟导览">×</button></header>
      <div className="essential-tour__orbit" aria-hidden="true"><i style={{ "--tour-angle": `${chapter * 72}deg` } as CSSProperties} /></div>
      <article key={voice.id}>
        <span>CHAPTER {String(chapter + 1).padStart(2, "0")} / {String(voices.length).padStart(2, "0")} · {formatYear(voice.year)}</span>
        <p>{place?.name} · {place?.country}</p>
        <h2 id="essential-tour-title">{voice.text}</h2>
        <blockquote>{voice.translation}</blockquote>
        <div>{voice.narration}</div>
        <footer><strong>{voice.author}</strong><i>{voice.work} · {voice.language}</i></footer>
      </article>
      <nav aria-label="三分钟导览章节">{voices.map((item, index) => <button key={item.id} type="button" className={index === chapter ? "active" : ""} onClick={() => setChapter(index)}><i>{String(index + 1).padStart(2, "0")}</i><span>{item.author}<small>{formatYear(item.year)}</small></span></button>)}</nav>
      <div className="essential-tour__controls"><button type="button" onClick={() => move(-1)}>← 上一章</button><button className="primary" type="button" onClick={() => setPlaying((value) => !value)}>{playing ? "暂停导览" : "自动播放"}</button><button type="button" onClick={() => move(1)}>下一章 →</button><button type="button" onClick={() => onEnter(voice.placeId, voice.id)}>进入这段历史</button></div>
    </section>
  );
}
