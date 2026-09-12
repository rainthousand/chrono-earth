"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Place } from "../data/places";

export type GlobePerformanceTier = "high" | "balanced" | "low";

export interface CameraAnnouncement {
  /** 每次相机完成一次有意义的定位时更新，避免重复播报同一位置。 */
  key: string | number;
  destination: string;
  altitudeKm?: number;
  isMoving?: boolean;
}

export interface ClusterAnnouncement {
  /** 每次展开操作的唯一标识，同一区域重复展开时也应更新。 */
  key: string | number;
  regionName: string;
  placeCount?: number;
}

export interface TimelineEventAnnouncement {
  key: string | number;
  placeName: string;
  year: number;
  title: string;
}

export type AnnouncedPlace = Pick<
  Place,
  "id" | "name" | "localName" | "country" | "eraLabel"
>;

export interface GlobeAccessibilityAnnouncerProps {
  performanceTier?: GlobePerformanceTier | null;
  camera?: CameraAnnouncement | null;
  expandedCluster?: ClusterAnnouncement | null;
  selectedPlace?: AnnouncedPlace | null;
  activeEvent?: TimelineEventAnnouncement | null;
  /** 时间轴连续拖动停止后多久播报，单位为毫秒。 */
  timelineDebounceMs?: number;
  /** 相机停止运动后多久播报，单位为毫秒。 */
  cameraDebounceMs?: number;
}

type LiveMessage = {
  text: string;
  revision: number;
};

const visuallyHidden: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const PERFORMANCE_LABELS: Record<GlobePerformanceTier, string> = {
  high: "高清",
  balanced: "均衡",
  low: "流畅",
};

function formatHistoricalYear(year: number): string {
  if (year < 0) return `公元前 ${Math.abs(year)} 年`;
  return `公元 ${year} 年`;
}

export function GlobeAccessibilityAnnouncer({
  performanceTier,
  camera,
  expandedCluster,
  selectedPlace,
  activeEvent,
  timelineDebounceMs = 500,
  cameraDebounceMs = 700,
}: GlobeAccessibilityAnnouncerProps) {
  const [politeMessage, setPoliteMessage] = useState<LiveMessage>({
    text: "",
    revision: 0,
  });
  const [assertiveMessage, setAssertiveMessage] = useState<LiveMessage>({
    text: "",
    revision: 0,
  });
  const previousTier = useRef<GlobePerformanceTier | null>(null);
  const previousCameraKey = useRef<CameraAnnouncement["key"] | null>(null);
  const previousClusterKey = useRef<ClusterAnnouncement["key"] | null>(null);
  const previousPlaceId = useRef<string | null>(null);
  const previousEventKey = useRef<TimelineEventAnnouncement["key"] | null>(
    null,
  );

  useEffect(() => {
    if (!performanceTier || performanceTier === previousTier.current) return;
    previousTier.current = performanceTier;
    setPoliteMessage((current) => ({
      text: `地球画质已切换为${PERFORMANCE_LABELS[performanceTier]}模式。`,
      revision: current.revision + 1,
    }));
  }, [performanceTier]);

  useEffect(() => {
    if (
      !expandedCluster ||
      expandedCluster.key === previousClusterKey.current
    ) {
      return;
    }
    previousClusterKey.current = expandedCluster.key;
    const countText = expandedCluster.placeCount
      ? `，包含 ${expandedCluster.placeCount} 个景点`
      : "";
    setPoliteMessage((current) => ({
      text: `已展开${expandedCluster.regionName}区域${countText}。`,
      revision: current.revision + 1,
    }));
  }, [expandedCluster]);

  useEffect(() => {
    const placeId = selectedPlace?.id ?? null;
    if (!selectedPlace) {
      previousPlaceId.current = null;
      return;
    }
    if (placeId === previousPlaceId.current) return;
    previousPlaceId.current = placeId;
    const localName =
      selectedPlace.localName && selectedPlace.localName !== selectedPlace.name
        ? `，当地名称 ${selectedPlace.localName}`
        : "";
    setAssertiveMessage((current) => ({
      text: `已选择${selectedPlace.name}${localName}。位于${selectedPlace.country}，${selectedPlace.eraLabel}。`,
      revision: current.revision + 1,
    }));
  }, [selectedPlace]);

  useEffect(() => {
    if (!camera || camera.isMoving) return;
    if (camera.key === previousCameraKey.current) return;
    const timer = window.setTimeout(() => {
      previousCameraKey.current = camera.key;
      const altitudeText =
        typeof camera.altitudeKm === "number"
          ? `，视角高度约 ${Math.round(camera.altitudeKm).toLocaleString(
              "zh-CN",
            )} 公里`
          : "";
      setPoliteMessage((current) => ({
        text: `地球视角已定位到${camera.destination}${altitudeText}。`,
        revision: current.revision + 1,
      }));
    }, cameraDebounceMs);

    return () => window.clearTimeout(timer);
  }, [camera, cameraDebounceMs]);

  useEffect(() => {
    if (!activeEvent || activeEvent.key === previousEventKey.current) return;
    const timer = window.setTimeout(() => {
      previousEventKey.current = activeEvent.key;
      setPoliteMessage((current) => ({
        text: `${activeEvent.placeName}，${formatHistoricalYear(activeEvent.year)}：${activeEvent.title}。`,
        revision: current.revision + 1,
      }));
    }, timelineDebounceMs);

    return () => window.clearTimeout(timer);
  }, [activeEvent, timelineDebounceMs]);

  return (
    <div style={visuallyHidden}>
      <p
        key={`polite-${politeMessage.revision}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {politeMessage.text}
      </p>
      <p
        key={`assertive-${assertiveMessage.revision}`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertiveMessage.text}
      </p>
    </div>
  );
}
