"use client";

import { useEffect, useRef } from "react";

export interface JourneyNarratorProps {
  enabled: boolean;
  text: string;
  rate?: number;
  onEnd?: () => void;
}

function findChineseVoice(voices: readonly SpeechSynthesisVoice[]) {
  return (
    voices.find(({ lang }) => lang.replace("_", "-").toLowerCase() === "zh-cn") ??
    voices.find(({ lang }) => lang.toLowerCase().startsWith("zh"))
  );
}

/**
 * 无视觉输出的旅程旁白控制器。
 * `enabled` 应只在用户主动开启旁白后设为 true，以满足浏览器播放策略。
 */
export default function JourneyNarrator({
  enabled,
  text,
  rate = 0.92,
  onEnd,
}: JourneyNarratorProps) {
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const synthesis = window.speechSynthesis;
    const narration = text.trim();

    synthesis.cancel();

    if (!enabled || !narration) {
      return;
    }

    let active = true;
    let hasStarted = false;
    let fallbackTimer: number | undefined;

    const speak = () => {
      if (!active || hasStarted) {
        return;
      }

      hasStarted = true;
      const utterance = new SpeechSynthesisUtterance(narration);
      const chineseVoice = findChineseVoice(synthesis.getVoices());

      utterance.lang = "zh-CN";
      utterance.rate = rate;
      utterance.pitch = 0.96;
      utterance.volume = 0.92;
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }

      utterance.onend = () => {
        if (active) {
          onEndRef.current?.();
        }
      };

      synthesis.speak(utterance);
    };

    const voices = synthesis.getVoices();
    if (voices.length > 0) {
      speak();
    } else {
      synthesis.addEventListener("voiceschanged", speak, { once: true });
      fallbackTimer = window.setTimeout(speak, 250);
    }

    return () => {
      active = false;
      synthesis.removeEventListener("voiceschanged", speak);
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      synthesis.cancel();
    };
  }, [enabled, rate, text]);

  return null;
}
