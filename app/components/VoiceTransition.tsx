"use client";

import { useEffect, type CSSProperties } from "react";

import type { HistoricalVoice } from "../data/historicalVoices";

interface VoiceTransitionProps {
  from: HistoricalVoice;
  to: HistoricalVoice;
  fromPlace: string;
  toPlace: string;
  direction: -1 | 1;
  onMidpoint: () => void;
  onComplete: () => void;
}

function formatTransitYear(year: number) {
  return year < 0 ? `−${Math.abs(year)}` : String(year);
}

export default function VoiceTransition({
  from,
  to,
  fromPlace,
  toPlace,
  direction,
  onMidpoint,
  onComplete,
}: VoiceTransitionProps) {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const midpointTimer = window.setTimeout(onMidpoint, reducedMotion ? 80 : 760);
    const completeTimer = window.setTimeout(onComplete, reducedMotion ? 180 : 1750);
    return () => {
      window.clearTimeout(midpointTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, onMidpoint]);

  const characters = Array.from(`${from.text}${from.text}`).slice(0, 42);

  return (
    <section
      className={`voice-transition ${direction < 0 ? "is-reverse" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`正在从${fromPlace}的${from.author}前往${toPlace}的${to.author}`}
    >
      <div className="voice-transition__aperture" aria-hidden="true" />
      <div className="voice-transition__route" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="voice-transition__particles" aria-hidden="true">
        {characters.map((character, index) => (
          <span
            key={`${from.id}:${index}`}
            style={
              {
                "--particle-index": index,
                "--particle-row": (index % 7) - 3,
                "--particle-depth": (index % 5) - 2,
              } as CSSProperties
            }
          >
            {character === " " ? "·" : character}
          </span>
        ))}
      </div>
      <div className="voice-transition__years" aria-hidden="true">
        <strong>{formatTransitYear(from.year)}</strong>
        <span>{Math.abs(to.year - from.year).toLocaleString("zh-CN")} YEARS</span>
        <strong>{formatTransitYear(to.year)}</strong>
      </div>
      <div className="voice-transition__destinations" aria-hidden="true">
        <p><small>DEPARTURE</small>{fromPlace}</p>
        <i />
        <p><small>ARRIVAL</small>{toPlace}</p>
      </div>
      <p className="voice-transition__arrival" aria-hidden="true">
        <small>NEXT VOICE · {to.language.toUpperCase()}</small>
        <span>{to.text}</span>
        <i>— {to.author}</i>
      </p>
    </section>
  );
}
