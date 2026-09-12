"use client";

import { useEffect, useRef } from "react";

export type SoundLens = "landmarks" | "routes" | "voices";
export type SoundCue = "lens" | "chapter" | "return" | "time" | null;

export interface AmbientSoundscapeProps {
  enabled: boolean;
  eraId: string;
  lens: SoundLens;
  storyActive?: boolean;
  traveling?: boolean;
  cue?: SoundCue;
  cueKey?: number;
}

interface SoundProfile {
  drone: number;
  overtone: number;
  cutoff: number;
  wind: number;
}

interface SoundGraph {
  context: AudioContext;
  master: GainNode;
  windGain: GainNode;
  windFilter: BiquadFilterNode;
  droneGain: GainNode;
  droneFilter: BiquadFilterNode;
  fundamental: OscillatorNode;
  overtone: OscillatorNode;
}

const PROFILES: Readonly<Record<string, SoundProfile>> = {
  "first-monuments": { drone: 38, overtone: 57, cutoff: 410, wind: 0.022 },
  "classical-crossroads": { drone: 43, overtone: 64.5, cutoff: 560, wind: 0.024 },
  "faith-and-roads": { drone: 47, overtone: 70.5, cutoff: 470, wind: 0.021 },
  "oceans-and-empires": { drone: 40, overtone: 60, cutoff: 720, wind: 0.028 },
  "connected-world": { drone: 45, overtone: 67.5, cutoff: 840, wind: 0.02 },
};

const DEFAULT_PROFILE = PROFILES["faith-and-roads"];
const LENS_TUNING: Readonly<Record<SoundLens, { ratio: number; wind: number; overtone: number }>> = {
  landmarks: { ratio: 1, wind: 0.82, overtone: 0.2 },
  routes: { ratio: 1.125, wind: 1.16, overtone: 0.29 },
  voices: { ratio: 1.25, wind: 0.62, overtone: 0.36 },
};

function noiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < samples.length; index += 1) {
    previous = previous * 0.985 + (Math.random() * 2 - 1) * 0.015;
    samples[index] = previous * 3.1;
  }
  return buffer;
}

function toneCue(graph: SoundGraph, cue: Exclude<SoundCue, null>, profile: SoundProfile) {
  const { context, master } = graph;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const cueShape = {
    lens: { start: 2.5, end: 1.35, duration: 0.72, level: 0.055, type: "sine" as OscillatorType },
    chapter: { start: 1.1, end: 0.72, duration: 0.95, level: 0.07, type: "triangle" as OscillatorType },
    return: { start: 0.68, end: 1.8, duration: 1.65, level: 0.08, type: "sine" as OscillatorType },
    time: { start: 3.2, end: 1.6, duration: 0.46, level: 0.035, type: "sine" as OscillatorType },
  }[cue];
  oscillator.type = cueShape.type;
  oscillator.frequency.setValueAtTime(profile.drone * cueShape.start, now);
  oscillator.frequency.exponentialRampToValueAtTime(profile.drone * cueShape.end, now + cueShape.duration);
  overtone.type = "sine";
  overtone.frequency.value = profile.overtone * 2.02;
  filter.type = "lowpass";
  filter.frequency.value = cue === "time" ? 1100 : 680;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(cueShape.level, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + cueShape.duration);
  oscillator.connect(filter);
  overtone.connect(filter);
  filter.connect(gain).connect(master);
  oscillator.start(now);
  overtone.start(now);
  oscillator.stop(now + cueShape.duration + 0.05);
  overtone.stop(now + cueShape.duration + 0.05);
}

export function AmbientSoundscape({
  enabled,
  eraId,
  lens,
  storyActive = false,
  traveling = false,
  cue = null,
  cueKey = 0,
}: AmbientSoundscapeProps) {
  const graphRef = useRef<SoundGraph | null>(null);
  const lastCueRef = useRef(0);
  const eraIdRef = useRef(eraId);

  useEffect(() => {
    eraIdRef.current = eraId;
  }, [eraId]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let cancelled = false;

    const start = () => {
      if (cancelled || graphRef.current) return;
      const Constructor = window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return;
      const context = new Constructor();
      const master = context.createGain();
      master.gain.setValueAtTime(0.0001, context.currentTime);
      master.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 2.2);
      master.connect(context.destination);

      const wind = context.createBufferSource();
      const windFilter = context.createBiquadFilter();
      const windGain = context.createGain();
      wind.buffer = noiseBuffer(context);
      wind.loop = true;
      windFilter.type = "lowpass";
      windFilter.Q.value = 0.55;
      wind.connect(windFilter).connect(windGain).connect(master);

      const droneFilter = context.createBiquadFilter();
      const droneGain = context.createGain();
      const fundamental = context.createOscillator();
      const overtone = context.createOscillator();
      const overtoneGain = context.createGain();
      droneFilter.type = "lowpass";
      droneFilter.Q.value = 0.8;
      fundamental.type = "sine";
      overtone.type = "sine";
      overtoneGain.gain.value = 0.24;
      fundamental.connect(droneFilter);
      overtone.connect(overtoneGain).connect(droneFilter);
      droneFilter.connect(droneGain).connect(master);
      wind.start();
      fundamental.start();
      overtone.start();
      graphRef.current = { context, master, windGain, windFilter, droneGain, droneFilter, fundamental, overtone };
      void context.resume();
      toneCue(graphRef.current, "return", PROFILES[eraIdRef.current] ?? DEFAULT_PROFILE);
    };

    const events = ["pointerdown", "keydown"] as const;
    events.forEach((name) => window.addEventListener(name, start, { once: true, passive: true }));
    if (navigator.userActivation?.isActive || navigator.userActivation?.hasBeenActive) start();
    return () => {
      cancelled = true;
      events.forEach((name) => window.removeEventListener(name, start));
      const graph = graphRef.current;
      graphRef.current = null;
      if (graph) {
        graph.master.gain.cancelScheduledValues(graph.context.currentTime);
        graph.master.gain.setTargetAtTime(0.0001, graph.context.currentTime, 0.08);
        window.setTimeout(() => void graph.context.close(), 450);
      }
    };
  }, [enabled]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!enabled || !graph) return;
    const profile = PROFILES[eraId] ?? DEFAULT_PROFILE;
    const tuning = LENS_TUNING[lens];
    const now = graph.context.currentTime;
    const storyRatio = storyActive ? 0.82 : 1;
    graph.fundamental.frequency.setTargetAtTime(profile.drone * tuning.ratio * storyRatio, now, 1.35);
    graph.overtone.frequency.setTargetAtTime(profile.overtone * tuning.ratio, now, 1.1);
    graph.windFilter.frequency.setTargetAtTime(profile.cutoff * (storyActive ? 0.58 : 1), now, 0.9);
    graph.windGain.gain.setTargetAtTime(profile.wind * tuning.wind * (traveling ? 1.75 : 1), now, 0.45);
    graph.droneFilter.frequency.setTargetAtTime(storyActive ? 102 : 145, now, 0.8);
    graph.droneGain.gain.setTargetAtTime(storyActive ? 0.073 : 0.052, now, 0.7);
  }, [enabled, eraId, lens, storyActive, traveling]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!enabled || !graph || !cue || cueKey === lastCueRef.current) return;
    lastCueRef.current = cueKey;
    toneCue(graph, cue, PROFILES[eraId] ?? DEFAULT_PROFILE);
  }, [cue, cueKey, enabled, eraId]);

  return null;
}

export default AmbientSoundscape;
