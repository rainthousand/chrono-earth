"use client";

import { useEffect, useMemo, useRef } from "react";

import type { HistoryRoute } from "../data/historyRoutes";
import { useModalFocus } from "../hooks/useModalFocus";
import {
  historicalVoices,
  type HistoricalEntityType,
} from "../data/historicalVoices";
import type { Place } from "../data/places";

interface CivilizationNetworkProps {
  places: readonly Place[];
  routes: readonly HistoryRoute[];
  currentYear: number;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<HistoryRoute["category"], string> = {
  trade: "贸易",
  migration: "迁徙",
  pilgrimage: "朝圣",
  conquest: "征服",
  sailing: "航海",
  knowledge: "知识",
};

const CATEGORY_COLORS: Record<HistoryRoute["category"], string> = {
  trade: "#d7ac62",
  migration: "#c7b782",
  pilgrimage: "#f0d8a1",
  conquest: "#c87955",
  sailing: "#76aaa5",
  knowledge: "#c2acd5",
};

const ENTITY_LABELS: Record<HistoricalEntityType, string> = {
  person: "人物",
  work: "著作",
  idea: "思想",
  invention: "发明与形式",
};

function formatNetworkYear(year: number) {
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

export default function CivilizationNetwork({
  places,
  routes,
  currentYear,
  onSelect,
  onClose,
}: CivilizationNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, onClose);
  const networkPlaces = useMemo(() => {
    const ids = new Set(routes.flatMap((route) => [route.from, route.to]));
    return places.filter((place) => ids.has(place.id as HistoryRoute["from"]));
  }, [places, routes]);
  const activeRoutes = useMemo(
    () =>
      routes
        .map((route) => ({
          route,
          distance:
            currentYear < route.period[0]
              ? route.period[0] - currentYear
              : currentYear > route.period[1]
                ? currentYear - route.period[1]
                : 0,
        }))
        .sort((left, right) => left.distance - right.distance),
    [currentYear, routes],
  );
  const activeEntities = useMemo(() => {
    const nearestVoices = [...historicalVoices]
      .sort(
        (left, right) =>
          Math.abs(left.year - currentYear) - Math.abs(right.year - currentYear),
      )
      .slice(0, 4);
    const seen = new Set<string>();
    return nearestVoices.flatMap((voice) =>
      voice.entities
        .filter((entity) => {
          if (seen.has(entity.id)) return false;
          seen.add(entity.id);
          return true;
        })
        .map((entity) => ({ entity, voice })),
    );
  }, [currentYear]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let lastDraw = 0;

    const draw = (now: number) => {
      if (now - lastDraw < 34) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const radius = Math.min(rect.width, rect.height) * 0.34;
      const positions = new Map<string, [number, number]>();
      networkPlaces.forEach((place, index) => {
        const angle = -Math.PI / 2 + (index / networkPlaces.length) * Math.PI * 2;
        positions.set(place.id, [
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
        ]);
      });

      routes.forEach((route, index) => {
        const start = positions.get(route.from);
        const end = positions.get(route.to);
        if (!start || !end) return;
        const isActive = currentYear >= route.period[0] && currentYear <= route.period[1];
        const color = CATEGORY_COLORS[route.category];
        const gradient = context.createLinearGradient(...start, ...end);
        gradient.addColorStop(0, `${color}${isActive ? "db" : "3d"}`);
        gradient.addColorStop(0.5, `${color}${isActive ? "8f" : "25"}`);
        gradient.addColorStop(1, `${color}${isActive ? "db" : "3d"}`);
        context.strokeStyle = gradient;
        context.lineWidth = isActive ? 1.5 : 0.65;
        context.beginPath();
        context.moveTo(...start);
        const bend = ((index % 3) - 1) * 28;
        context.quadraticCurveTo(centerX + bend, centerY - bend, ...end);
        context.stroke();

        if (isActive) {
          const progress = ((now / 2600 + index * 0.19) % 1);
          const inverse = 1 - progress;
          const particleX =
            inverse * inverse * start[0] +
            2 * inverse * progress * (centerX + bend) +
            progress * progress * end[0];
          const particleY =
            inverse * inverse * start[1] +
            2 * inverse * progress * (centerY - bend) +
            progress * progress * end[1];
          context.fillStyle = color;
          context.shadowColor = color;
          context.shadowBlur = 12;
          context.beginPath();
          context.arc(particleX, particleY, 2.2, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
        }
      });
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [currentYear, networkPlaces, routes]);

  return (
    <section ref={dialogRef} tabIndex={-1} className="civilization-network" role="dialog" aria-modal="true" aria-labelledby="civilization-network-title">
      <header>
        <div>
          <span>THE THREADS BETWEEN WORLDS</span>
          <h2 id="civilization-network-title">文明关系网络</h2>
          <p>{formatNetworkYear(currentYear)} · {activeRoutes.filter(({ distance }) => distance === 0).length} 条关联正在发光</p>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭文明关系网络">×</button>
      </header>
      <div className="civilization-network__stage">
        <canvas ref={canvasRef} aria-hidden="true" />
        {networkPlaces.map((place, index) => {
          const angle = -Math.PI / 2 + (index / networkPlaces.length) * Math.PI * 2;
          const style = {
            left: `${50 + Math.cos(angle) * 34}%`,
            top: `${50 + Math.sin(angle) * 34}%`,
          };
          return (
            <button
              key={place.id}
              className="civilization-network__node"
              type="button"
              style={style}
              onClick={() => onSelect(place.id)}
            >
              <i aria-hidden="true" />
              <span>{place.name}</span>
              <small>{place.country}</small>
            </button>
          );
        })}
        <div className="civilization-network__core" aria-hidden="true">
          <span>{formatNetworkYear(currentYear)}</span>
          <strong>人类从未孤立</strong>
        </div>
      </div>
      <aside className="civilization-network__routes" aria-label="最接近当前年代的文明关联">
        {activeRoutes.slice(0, 5).map(({ route, distance }) => (
          <div key={route.id} className={distance === 0 ? "active" : ""}>
            <i style={{ background: CATEGORY_COLORS[route.category] }} />
            <span>{route.label}</span>
            <small>{CATEGORY_LABELS[route.category]} · {formatNetworkYear(route.period[0])}</small>
          </div>
        ))}
      </aside>
      <aside className="civilization-network__entities" aria-label="当前年代的人物、著作与思想">
        <p>VOICES &amp; IDEAS · {activeEntities.length}</p>
        {activeEntities.slice(0, 9).map(({ entity, voice }) => (
          <button
            key={`${voice.id}:${entity.id}`}
            type="button"
            onClick={() => onSelect(voice.placeId)}
          >
            <i>{ENTITY_LABELS[entity.type]}</i>
            <span>{entity.label}</span>
            <small>{entity.relation} · {voice.author}</small>
          </button>
        ))}
      </aside>
    </section>
  );
}
