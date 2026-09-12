"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  getVoicesNearYear,
  historicalVoices,
} from "../data/historicalVoices";

interface CivilizationNebulaProps {
  currentYear: number;
  onSelect: (placeId: string, voiceId: string) => void;
  sparse?: boolean;
}

type ResonanceRange = "near" | "era" | "wide";
type NebulaSide = "left" | "right";

interface NebulaSlot {
  side: NebulaSide;
  y: number;
}

const NEBULA_SLOTS: readonly NebulaSlot[] = [
  { side: "left", y: 25 },
  { side: "right", y: 28 },
  { side: "left", y: 55 },
  { side: "right", y: 58 },
  { side: "left", y: 39 },
  { side: "right", y: 42 },
  { side: "left", y: 69 },
  { side: "right", y: 72 },
  { side: "left", y: 17 },
  { side: "right", y: 18 },
  { side: "left", y: 80 },
  { side: "right", y: 81 },
];

const RESONANCE_RANGES: readonly {
  id: ResonanceRange;
  label: string;
  english: string;
  years: number;
}[] = [
  { id: "near", label: "近场", english: "±300", years: 300 },
  { id: "era", label: "时代", english: "±800", years: 800 },
  { id: "wide", label: "广域", english: "±1800", years: 1800 },
];

function hashText(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function formatNebulaYear(year: number) {
  return year < 0 ? `前 ${Math.abs(year)}` : String(year);
}

export default function CivilizationNebula({
  currentYear,
  onSelect,
  sparse = false,
}: CivilizationNebulaProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [resonanceRange, setResonanceRange] = useState<ResonanceRange>("era");
  const [activeVoice, setActiveVoice] = useState<{
    id: string;
    context: string;
  } | null>(null);
  const interactionContext = `${currentYear}:${resonanceRange}:${sparse ? "sparse" : "immersive"}`;
  const activeVoiceId =
    activeVoice?.context === interactionContext ? activeVoice.id : null;
  const fragments = useMemo(() => {
    if (sparse) return getVoicesNearYear(currentYear, 4);
    const years = RESONANCE_RANGES.find(({ id }) => id === resonanceRange)?.years ?? 800;
    const withinRange = historicalVoices
      .map((voice) => ({ voice, distance: Math.abs(voice.year - currentYear) }))
      .filter(({ distance }) => distance <= years)
      .sort((left, right) => left.distance - right.distance);
    return (withinRange.length >= 5 ? withinRange : getVoicesNearYear(currentYear, 8)).slice(0, 12);
  }, [currentYear, resonanceRange, sparse]);
  const activeFragment = activeVoiceId
    ? fragments.find(({ voice }) => voice.id === activeVoiceId) ?? null
    : null;

  useEffect(() => {
    if (
      sparse ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(pointer: fine)").matches
    ) return;
    let animationFrame: number | null = null;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    const applyParallax = () => {
      animationFrame = null;
      const root = rootRef.current;
      if (!root) return;
      const normalizedX = pointerX / Math.max(window.innerWidth, 1) - 0.5;
      const normalizedY = pointerY / Math.max(window.innerHeight, 1) - 0.5;
      root.querySelectorAll<HTMLElement>("button[data-depth]").forEach((button) => {
        const depth = Number(button.dataset.depth ?? 0.5);
        button.style.setProperty("--nebula-shift-x", `${normalizedX * depth * -28}px`);
        button.style.setProperty("--nebula-shift-y", `${normalizedY * depth * -18}px`);
      });
    };
    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(applyParallax);
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [sparse]);

  return (
    <section
      ref={rootRef}
      className={`${sparse ? "civilization-nebula is-sparse" : "civilization-nebula is-immersive"}${activeFragment ? " has-active-voice" : ""}`}
      aria-label="当前时代文明文字星云"
      onPointerLeave={() => setActiveVoice(null)}
    >
      <p className="civilization-nebula__axis" aria-hidden="true">
        WORDS LEFT BY CIVILIZATIONS · {formatNebulaYear(currentYear)}
      </p>
      {!sparse && (
        <nav className="civilization-nebula__ranges" aria-label="历史之声时间共振范围">
          {RESONANCE_RANGES.map((range) => (
            <button
              key={range.id}
              className={resonanceRange === range.id ? "active" : ""}
              type="button"
              onClick={() => {
                setActiveVoice(null);
                setResonanceRange(range.id);
              }}
              aria-pressed={resonanceRange === range.id}
            >
              <span>{range.label}</span><small>{range.english}</small>
            </button>
          ))}
          <i>{String(fragments.length).padStart(2, "0")} VOICES</i>
        </nav>
      )}
      {fragments.map(({ voice, distance }, index) => {
        const seed = hashText(voice.id);
        const slot = NEBULA_SLOTS[index % NEBULA_SLOTS.length];
        const edgeJitter = (seed % 4) * 0.45;
        const verticalJitter = (((seed >> 9) % 5) - 2) * 0.38;
        const x = slot.side === "left" ? 4.5 + edgeJitter : 90.8 - edgeJitter;
        const y = slot.y + verticalJitter;
        const relevance = Math.max(0.22, 1 - distance / 2600);
        const depthNoise = ((seed >> 4) % 18) / 100;
        const depth = Math.min(0.98, 0.3 + relevance * 0.52 + depthNoise);
        const style = {
          "--nebula-x": `${x}%`,
          "--nebula-y": `${y}%`,
          "--nebula-anchor-x": slot.side === "left" ? "0%" : "-100%",
          "--nebula-delay": `${(seed % 900) / -100}s`,
          "--nebula-duration": `${13 + (seed % 13)}s`,
          "--nebula-scale": 0.7 + relevance * 0.3 + depth * 0.12,
          "--nebula-opacity": 0.16 + relevance * 0.48,
          "--nebula-layer-opacity": 0.5 + depth * 0.5,
          "--nebula-index": index,
          "--nebula-depth": depth,
          "--nebula-relevance": relevance,
          "--nebula-blur": `${Math.max(0, (0.72 - depth) * 1.45)}px`,
          "--nebula-rotate": `${((seed % 9) - 4) * 0.18}deg`,
          textAlign: slot.side === "left" ? "left" : "right",
          zIndex: 1 + Math.round(depth * 3),
        } as CSSProperties;

        return (
          <button
            key={voice.id}
            type="button"
            data-depth={depth.toFixed(2)}
            data-side={slot.side}
            data-active={activeVoiceId === voice.id ? "true" : "false"}
            style={style}
            onClick={() => onSelect(voice.placeId, voice.id)}
            onPointerEnter={() =>
              setActiveVoice({ id: voice.id, context: interactionContext })
            }
            onPointerLeave={() => setActiveVoice(null)}
            onFocus={() =>
              setActiveVoice({ id: voice.id, context: interactionContext })
            }
            onBlur={() => setActiveVoice(null)}
            aria-label={`${voice.author}，${formatNebulaYear(voice.year)}年，${voice.text}`}
          >
            <span lang={voice.language === "日语" ? "ja" : undefined}>{voice.text}</span>
            <small>{formatNebulaYear(voice.year)} · {voice.author} · {voice.work}</small>
          </button>
        );
      })}
      {!sparse && activeFragment && (
        <aside className="civilization-nebula__preview" aria-hidden="true">
          <span>{activeFragment.voice.language} · {formatNebulaYear(activeFragment.voice.year)}</span>
          <strong>{activeFragment.voice.translation}</strong>
          <p>{activeFragment.voice.narration}</p>
          <small>{activeFragment.voice.author} · {activeFragment.voice.work}</small>
        </aside>
      )}
    </section>
  );
}
