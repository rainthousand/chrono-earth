"use client";

import { useRef, useState, type CSSProperties } from "react";

import type { HistoricalVoice } from "../data/historicalVoices";
import type { VoiceJourney } from "../data/voiceJourneys";
import { useModalFocus } from "../hooks/useModalFocus";

interface VoiceJourneyCeremonyProps {
  phase: "prelude" | "finale";
  journey: VoiceJourney;
  voices: readonly HistoricalVoice[];
  narrationOn: boolean;
  narrationRate: number;
  onToggleNarration: () => void;
  onCycleNarrationRate: () => void;
  onBegin: () => void;
  onReplay: () => void;
  onClose: () => void;
}

function formatCeremonyYear(year: number) {
  return year < 0 ? `前 ${Math.abs(year)}` : String(year);
}

export default function VoiceJourneyCeremony({
  phase,
  journey,
  voices,
  narrationOn,
  narrationRate,
  onToggleNarration,
  onCycleNarrationRate,
  onBegin,
  onReplay,
  onClose,
}: VoiceJourneyCeremonyProps) {
  const [shareStatus, setShareStatus] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const years = voices.map(({ year }) => year);
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);

  useModalFocus(dialogRef, onClose);

  const shareJourney = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("voiceJourney", journey.id);
    const shareData = {
      title: `${journey.title} · Chrono Earth`,
      text: `${journey.description} 跟随 ${voices.length} 段文明原声穿越历史。`,
      url: url.toString(),
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(url.toString());
        setShareStatus("旅程链接已复制");
      }
    } catch {
      setShareStatus("可从浏览器地址栏复制旅程链接");
    }
  };

  return (
    <section
      ref={dialogRef}
      tabIndex={-1}
      className={`voice-journey-ceremony is-${phase}`}
      style={{ "--voice-journey-accent": journey.accent } as CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-journey-ceremony-title"
      onKeyDown={(event) => {
        if (event.key === "Enter" && phase === "prelude") onBegin();
      }}
    >
      <div className="voice-journey-ceremony__rings" aria-hidden="true"><i /><i /><i /></div>
      <button className="voice-journey-ceremony__close" type="button" onClick={onClose}>
        退出 ×
      </button>

      {phase === "prelude" ? (
        <article>
          <p>CURATED VOICE JOURNEY · {voices.length} CHAPTERS</p>
          <h2 id="voice-journey-ceremony-title">{journey.title}</h2>
          <h3>{journey.englishTitle}</h3>
          <blockquote>{journey.description}</blockquote>
          <div className="voice-journey-ceremony__timeline">
            {voices.map((voice, index) => (
              <span key={voice.id}>
                <i>{String(index + 1).padStart(2, "0")}</i>
                <strong>{voice.author}</strong>
                <small>{formatCeremonyYear(voice.year)} · {voice.work}</small>
              </span>
            ))}
          </div>
          <footer>
            <small>{formatCeremonyYear(firstYear)} — {formatCeremonyYear(lastYear)}</small>
            <button className="ceremony-narration" type="button" onClick={onToggleNarration}>
              {narrationOn ? "旁白已开启" : "开启中文旁白"}
            </button>
            <button className="ceremony-narration" type="button" onClick={onCycleNarrationRate}>
              语速 {narrationRate.toFixed(2)}×
            </button>
            <button type="button" onClick={onBegin}>开始穿越这条思想航线 →</button>
            <i>ENTER 开始 · ESC 退出</i>
          </footer>
        </article>
      ) : (
        <article className="voice-journey-completion-card">
          <p>JOURNEY COMPLETED · CHRONO EARTH ARCHIVE</p>
          <span className="voice-journey-completion-card__seal" aria-hidden="true">CE</span>
          <h2 id="voice-journey-ceremony-title">{journey.title}</h2>
          <blockquote>{journey.closingLine}</blockquote>
          <div className="voice-journey-completion-card__voices">
            {voices.map((voice) => (
              <span key={voice.id}>
                <strong>{voice.text}</strong>
                <small>{voice.author} · {formatCeremonyYear(voice.year)}</small>
              </span>
            ))}
          </div>
          <div className="voice-journey-completion-card__metrics">
            <span><strong>{voices.length}</strong>文明原声</span>
            <span><strong>{Math.abs(lastYear - firstYear).toLocaleString("zh-CN")}</strong>年时间跨度</span>
            <span><strong>{new Set(voices.map(({ language }) => language)).size}</strong>种语言传统</span>
          </div>
          <footer>
            <button className="ceremony-narration" type="button" onClick={onToggleNarration}>
              {narrationOn ? "关闭结语旁白" : "聆听结语"}
            </button>
            <button type="button" onClick={() => void shareJourney()}>
              {shareStatus || "分享旅程完成卡 ↗"}
            </button>
            <button type="button" onClick={onReplay}>重新穿越</button>
            <button type="button" onClick={onClose}>回到地球</button>
          </footer>
        </article>
      )}
    </section>
  );
}
