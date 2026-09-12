"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  PerformanceMode,
  PerformanceTier,
} from "./GlobeScene";

interface GlobePerformanceControlsProps {
  mode: PerformanceMode;
  activeTier: PerformanceTier;
  runtimeFps?: number | null;
  onChange: (mode: PerformanceMode) => void;
  onClose: () => void;
}

const OPTIONS: readonly {
  id: PerformanceMode;
  label: string;
  detail: string;
}[] = [
  { id: "auto", label: "自动", detail: "跟随设备能力" },
  { id: "high", label: "精细", detail: "8K · 4× 抗锯齿" },
  { id: "balanced", label: "均衡", detail: "4K · 2× 抗锯齿" },
  { id: "low", label: "流畅", detail: "4K · 精简粒子" },
];

const TIER_LABELS: Record<PerformanceTier, string> = {
  high: "精细",
  balanced: "均衡",
  low: "流畅",
};

export default function GlobePerformanceControls({
  mode,
  activeTier,
  runtimeFps,
  onChange,
  onClose,
}: GlobePerformanceControlsProps) {
  const [fps, setFps] = useState<number | null>(null);
  const device = useMemo(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return { dpr: 1, cores: 0, memory: undefined, viewport: "—" };
    }
    const navigatorWithMemory = navigator as Navigator & {
      deviceMemory?: number;
    };
    return {
      dpr: window.devicePixelRatio || 1,
      cores: navigator.hardwareConcurrency || 0,
      memory: navigatorWithMemory.deviceMemory,
      viewport: `${window.innerWidth} × ${window.innerHeight}`,
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let frameCount = 0;
    let startedAt = performance.now();
    let lastReportedAt = startedAt;

    const measure = (now: number) => {
      frameCount += 1;
      if (now - lastReportedAt >= 900) {
        setFps(Math.round((frameCount * 1000) / (now - startedAt)));
        frameCount = 0;
        startedAt = now;
        lastReportedAt = now;
      }
      frame = requestAnimationFrame(measure);
    };

    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <aside
      className="performance-console"
      aria-labelledby="performance-console-title"
    >
      <header>
        <div>
          <span>RENDER CONTROL</span>
          <h2 id="performance-console-title">地球画质</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭画质控制">
          ×
        </button>
      </header>

      <div className="performance-status">
        <span>ACTIVE PROFILE</span>
        <strong>{TIER_LABELS[activeTier]}</strong>
        <small>{mode === "auto" ? "设备自动判定" : "手动锁定"}</small>
      </div>

      <div className="performance-options" role="radiogroup" aria-label="画质档位">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={mode === option.id}
            className={mode === option.id ? "active" : ""}
            onClick={() => onChange(option.id)}
          >
            <span>{option.label}</span>
            <small>{option.detail}</small>
          </button>
        ))}
      </div>

      <dl className="performance-metrics" aria-label="实时性能诊断">
        <div>
          <dt>FPS</dt>
          <dd>{runtimeFps ?? fps ?? "—"}</dd>
        </div>
        <div>
          <dt>DPR</dt>
          <dd>{device.dpr.toFixed(2)}</dd>
        </div>
        <div>
          <dt>VIEWPORT</dt>
          <dd>{device.viewport}</dd>
        </div>
        <div>
          <dt>DEVICE</dt>
          <dd>
            {device.cores || "—"} 核
            {device.memory ? ` · ${device.memory} GB` : ""}
          </dd>
        </div>
      </dl>

      <p className="performance-note">
        自动模式会在连续两次拖动低于 42 FPS 时降低一级画质；手动偏好仅保存在此设备。
      </p>
    </aside>
  );
}
