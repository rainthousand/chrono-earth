"use client";

import { useRef, type CSSProperties } from "react";

import { historicalVoices } from "../data/historicalVoices";
import { voiceJourneys } from "../data/voiceJourneys";
import { useModalFocus } from "../hooks/useModalFocus";

interface VoiceJourneyLibraryProps {
  onStart: (journeyId: string) => void;
  onClose: () => void;
}

export default function VoiceJourneyLibrary({
  onStart,
  onClose,
}: VoiceJourneyLibraryProps) {
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, onClose);

  return (
    <section
      ref={dialogRef}
      tabIndex={-1}
      className="voice-journey-library"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-journey-library-title"
    >
      <header>
        <div>
          <span>CURATED VOYAGES THROUGH HUMAN WORDS</span>
          <h2 id="voice-journey-library-title">诗性历史旅程</h2>
          <p>让散落在时间中的原声，组成一条可以连续穿越的思想航线。</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭诗性历史旅程">×</button>
      </header>

      <div className="voice-journey-library__grid">
        {voiceJourneys.map((journey, journeyIndex) => {
          const voices = journey.voiceIds.flatMap((voiceId) => {
            const voice = historicalVoices.find(({ id }) => id === voiceId);
            return voice ? [voice] : [];
          });
          return (
            <article
              key={journey.id}
              style={{ "--voice-journey-accent": journey.accent } as CSSProperties}
            >
              <p>{String(journeyIndex + 1).padStart(2, "0")} · {journey.englishTitle}</p>
              <h3>{journey.title}</h3>
              <blockquote>{journey.description}</blockquote>
              <ol>
                {voices.map((voice) => (
                  <li key={voice.id}>
                    <span>{voice.text}</span>
                    <small>{voice.author} · {voice.year < 0 ? `前 ${Math.abs(voice.year)}` : voice.year}</small>
                  </li>
                ))}
              </ol>
              <footer>
                <span>{voices.length} 个章节 · 约 {Math.ceil((voices.length * 8) / 60)} 分钟</span>
                <button type="button" onClick={() => onStart(journey.id)}>
                  开始这段旅程 →
                </button>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
}
