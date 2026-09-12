"use client";

import { useRef } from "react";

import type { HistoricalVoice } from "../data/historicalVoices";
import { useModalFocus } from "../hooks/useModalFocus";
import "./VoiceImmersion.typography.css";

interface VoiceImmersionProps {
  voice: HistoricalVoice;
  placeName: string;
  soundOn: boolean;
  journey?: {
    title: string;
    chapter: number;
    total: number;
    playing: boolean;
  } | null;
  narrationText?: string;
  narrationOn?: boolean;
  narrationRate?: number;
  onToggleSound: () => void;
  onToggleJourneyPlay: () => void;
  onOpenJourneys: () => void;
  onOpenArchive: () => void;
  onToggleNarration: () => void;
  onCycleNarrationRate: () => void;
  onClose: () => void;
  onExplore: () => void;
  onNavigate: (direction: -1 | 1) => void;
}

function formatVoiceYear(year: number) {
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

const voiceLanguageTags: Record<string, string> = {
  古汉语: "zh-Hant",
  古希腊语: "grc",
  英语公版译文: "en",
  拉丁语: "la",
  意大利语: "it",
  日语: "ja",
  英语: "en",
  古英语: "ang",
  西班牙语: "es",
  波斯语: "fa",
  阿拉伯语: "ar",
  希伯来语: "he",
  巴利语: "pi-Latn",
  梵语: "sa",
  "英语（作者自译）": "en",
  古典日语: "ja",
};

export default function VoiceImmersion({
  voice,
  placeName,
  soundOn,
  journey,
  narrationText,
  narrationOn = false,
  narrationRate = 0.92,
  onToggleSound,
  onToggleJourneyPlay,
  onOpenJourneys,
  onOpenArchive,
  onToggleNarration,
  onCycleNarrationRate,
  onClose,
  onExplore,
  onNavigate,
}: VoiceImmersionProps) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, onClose);
  const languageTag = voiceLanguageTags[voice.language];

  return (
    <section
      ref={dialogRef}
      tabIndex={-1}
      className="voice-immersion"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-immersion-title"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onNavigate(-1);
        if (event.key === "ArrowRight") onNavigate(1);
      }}
    >
      <div className="voice-immersion__vignette" aria-hidden="true" />
      <div className="voice-immersion__orbit" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      <header>
        <p>VOICE OF CIVILIZATION · {voice.language.toUpperCase()}</p>
        <div>
          <button type="button" onClick={onOpenArchive}>原声档案</button>
          <button type="button" onClick={onOpenJourneys}>诗性旅程</button>
          <button type="button" onClick={onClose} aria-label="退出文明原声沉浸模式">
            退出沉浸 ×
          </button>
        </div>
      </header>

      <div className="voice-immersion__coordinate" aria-hidden="true">
        <span>{formatVoiceYear(voice.year)}</span>
        <i />
        <span>{placeName}</span>
      </div>

      <article key={voice.id}>
        {journey && (
          <div className="voice-immersion__journey">
            <span>
              主题旅程 · {journey.title}
              <small>{journey.chapter} / {journey.total}</small>
            </span>
            <i aria-hidden="true">
              <b style={{ width: `${(journey.chapter / journey.total) * 100}%` }} />
            </i>
            <button type="button" onClick={onToggleJourneyPlay}>
              {journey.playing ? "暂停自动播放" : "继续自动播放"}
            </button>
          </div>
        )}
        <p className="voice-immersion__eyebrow">A LINE THAT OUTLIVED ITS WORLD</p>
        <h2
          id="voice-immersion-title"
          className="voice-immersion__quote"
          lang={languageTag}
          dir="auto"
        >
          {voice.text}
        </h2>
        <p className="voice-immersion__translation">{voice.translation}</p>
        <p className="voice-immersion__narration">{voice.narration}</p>
        <div className="voice-immersion__author">
          <strong>{voice.author}</strong>
          <span>{voice.work}</span>
        </div>
        <div className="voice-immersion__entities" aria-label="相关人物、著作与思想">
          {voice.entities.map((entity) => (
            <span key={entity.id}>
              <i>{entity.type.toUpperCase()}</i>
              {entity.label}
              <small>{entity.relation}</small>
            </span>
          ))}
        </div>
      </article>

      {journey && narrationText && (
        <aside className="voice-documentary-subtitles" aria-label="中文旁白字幕">
          <span>DOCUMENTARY NARRATION · 中文字幕</span>
          <p>{narrationText}</p>
          <div>
            <button type="button" onClick={onToggleNarration}>
              {narrationOn ? "暂停旁白" : "开启旁白"}
            </button>
            <button type="button" onClick={onCycleNarrationRate}>
              语速 {narrationRate.toFixed(2)}×
            </button>
          </div>
        </aside>
      )}

      <footer>
        <button type="button" onClick={() => onNavigate(-1)} aria-label="上一段文明原声">
          ← 上一声
        </button>
        <button
          className={soundOn ? "voice-sound active" : "voice-sound"}
          type="button"
          onClick={onToggleSound}
        >
          <i aria-hidden="true" />
          {soundOn ? "环境声已开启" : "开启环境声"}
        </button>
        <a href={voice.sourceUrl} target="_blank" rel="noreferrer">
          {voice.sourceName} · 原典 ↗
        </a>
        <button type="button" onClick={() => onNavigate(1)} aria-label="下一段文明原声">
          下一声 →
        </button>
        <button className="voice-explore" type="button" onClick={onExplore}>
          进入这段历史
        </button>
      </footer>
    </section>
  );
}
