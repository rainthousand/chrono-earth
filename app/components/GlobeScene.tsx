"use client";

import { useEffect, useRef } from "react";
import {
  historyRoutes,
  type HistoryRoute,
  type HistoryRouteCategory,
} from "../data/historyRoutes";

type CesiumModule = typeof import("cesium");
type CesiumViewer = import("cesium").Viewer;
type CesiumMarkerCollection = import("cesium").BillboardCollection;
type CesiumClusterCollection = import("cesium").LabelCollection;
type CesiumVoiceCollection = import("cesium").LabelCollection;
type CesiumDustCollection = import("cesium").PointPrimitiveCollection;
type CesiumRouteCollection = import("cesium").PolylineCollection;
type CesiumRouteParticleCollection = import("cesium").PointPrimitiveCollection;
type CesiumRouteParticle = import("cesium").PointPrimitive;
type CesiumCartesian3 = import("cesium").Cartesian3;
type CesiumEntity = import("cesium").Entity;

export interface GlobePlace {
  id: string;
  name: string;
  coordinates: readonly [longitude: number, latitude: number];
  altitude?: number;
  importance?: 1 | 2 | 3;
  period?: readonly [startYear: number, endYear: number];
}

export interface GlobeVoice {
  id: string;
  placeId: string;
  text: string;
  author: string;
  year: number;
  coordinates: readonly [longitude: number, latitude: number];
}

export interface GlobeSceneProps {
  places: readonly GlobePlace[];
  voices?: readonly GlobeVoice[];
  currentYear: number;
  selectedId?: string | null;
  routeCategoryFilter?: HistoryRouteCategory | null;
  minimalMode?: boolean;
  routeLensActive?: boolean;
  landmarkLensActive?: boolean;
  openingPlaceId?: string | null;
  openingPhase?: "boot" | "focus" | "depart" | "done";
  performanceMode?: PerformanceMode;
  enabled?: boolean;
  onSelect: (id: string) => void;
  onPerformanceTierChange?: (tier: PerformanceTier) => void;
  onCameraSettled?: (view: GlobeCameraView) => void;
  onClusterExpand?: (cluster: GlobeClusterView) => void;
  onRuntimePerformance?: (report: RuntimePerformanceReport) => void;
  onRouteHover?: (route: GlobeRouteView | null) => void;
  onRouteSelect?: (route: GlobeRouteView) => void;
  onPlaceHover?: (placeId: string | null) => void;
}

export interface GlobeCameraView {
  longitude: number;
  latitude: number;
  altitudeKm: number;
}

export interface GlobeClusterView {
  regionName: string;
  placeCount: number;
}

export interface RuntimePerformanceReport {
  fps: number;
  tier: PerformanceTier;
  adapted: boolean;
}

export interface GlobeRouteView {
  id: string;
  label: string;
  category: HistoryRouteCategory;
  period: readonly [startYear: number, endYear: number];
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
}

type MarkerIdentity = {
  kind: "chrono-earth-place";
  placeId: string;
};

type ClusterIdentity = {
  kind: "chrono-earth-cluster";
  regionName: string;
  longitude: number;
  latitude: number;
  targetAltitude: number;
  placeCount: number;
};

type VoiceIdentity = {
  kind: "chrono-earth-voice";
  placeId: string;
  voiceId: string;
};

type RouteIdentity = {
  kind: "chrono-earth-route";
  routeId: string;
};

interface RouteParticleEntry {
  route: HistoryRoute;
  positions: readonly CesiumCartesian3[];
  particles: readonly CesiumRouteParticle[];
  phase: number;
}

const FAR_FROM_PERIOD_ALPHA = 0.12;
const PERIOD_FADE_YEARS = 350;
const ROUTE_FADE_YEARS = 700;
const GLOBAL_MARKER_ALTITUDE = 17_000_000;
const REGIONAL_MARKER_ALTITUDE = 10_000_000;
const LOCAL_MARKER_ALTITUDE = 6_500_000;
const MAX_GLOBAL_CLUSTER_LABELS = 12;
const MAX_REGIONAL_CLUSTER_LABELS = 18;
const CLUSTER_FLY_TO_ALTITUDE = 7_200_000;

export type PerformanceTier = "high" | "balanced" | "low";
export type PerformanceMode = "auto" | PerformanceTier;

interface PerformanceProfile {
  tier: PerformanceTier;
  targetPixelRatio: number;
  textureUrl: string;
  dustCount: number;
  showDust: boolean;
  markerLimits: readonly [global: number, regional: number, local: number];
  clusterLimits: readonly [global: number, regional: number];
  msaaSamples: number;
  maximumScreenSpaceError: number;
}

function getLowerPerformanceTier(tier: PerformanceTier): PerformanceTier {
  if (tier === "high") return "balanced";
  return "low";
}

function getPerformanceProfile(
  performanceMode: PerformanceMode = "auto",
): PerformanceProfile {
  const navigatorWithMemory = navigator as Navigator & {
    deviceMemory?: number;
  };
  const deviceMemory = navigatorWithMemory.deviceMemory ?? 8;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const shortEdge = Math.min(window.innerWidth, window.innerHeight);
  const renderedPixelLoad =
    window.innerWidth *
    window.innerHeight *
    devicePixelRatio *
    devicePixelRatio;
  const lowTier =
    reducedMotion ||
    deviceMemory <= 4 ||
    hardwareConcurrency <= 4 ||
    shortEdge < 620 ||
    renderedPixelLoad > 12_000_000;
  const highTier =
    !lowTier &&
    deviceMemory >= 8 &&
    hardwareConcurrency >= 8 &&
    devicePixelRatio <= 2.25 &&
    window.innerWidth >= 1280 &&
    shortEdge >= 720 &&
    renderedPixelLoad <= 10_000_000;
  const selectedTier: PerformanceTier =
    performanceMode === "auto"
      ? highTier
        ? "high"
        : lowTier
          ? "low"
          : "balanced"
      : performanceMode;

  if (selectedTier === "high") {
    return {
      tier: "high",
      targetPixelRatio: 1.65,
      textureUrl: "/images/earth-blue-marble-8k.jpg",
      dustCount: 520,
      showDust: true,
      markerLimits: [14, 32, 64],
      clusterLimits: [14, 20],
      msaaSamples: 4,
      maximumScreenSpaceError: 1.5,
    };
  }

  if (selectedTier === "low") {
    return {
      tier: "low",
      targetPixelRatio: 1,
      textureUrl: "/images/earth-blue-marble-4k.jpg",
      dustCount: 0,
      showDust: false,
      markerLimits: [6, 16, 32],
      clusterLimits: [8, 12],
      msaaSamples: 1,
      maximumScreenSpaceError: 3,
    };
  }

  return {
    tier: "balanced",
    targetPixelRatio: 1.35,
    textureUrl: "/images/earth-blue-marble-4k.jpg",
    dustCount: 280,
    showDust: true,
    markerLimits: [10, 24, 48],
    clusterLimits: [MAX_GLOBAL_CLUSTER_LABELS, MAX_REGIONAL_CLUSTER_LABELS],
    msaaSamples: 2,
    maximumScreenSpaceError: 2,
  };
}

type RouteWaypoints = readonly (
  readonly [longitude: number, latitude: number]
)[];

interface EraVisual {
  atmosphere: {
    hue: number;
    saturation: number;
    brightness: number;
  };
  globeColor: string;
  dustColor: string;
  routeColor: string;
  routeBrightness: number;
}

function getEraVisual(currentYear: number): EraVisual {
  if (currentYear < 500) {
    return {
      atmosphere: { hue: 0.035, saturation: -0.5, brightness: -0.3 },
      globeColor: "#111a20",
      dustColor: "#e2bd72",
      routeColor: "#c9994e",
      routeBrightness: 0.8,
    };
  }
  if (currentYear < 1500) {
    return {
      atmosphere: { hue: 0.065, saturation: -0.6, brightness: -0.35 },
      globeColor: "#091b22",
      dustColor: "#d8b66e",
      routeColor: "#d2a04d",
      routeBrightness: 1,
    };
  }
  if (currentYear < 1800) {
    return {
      atmosphere: { hue: 0.085, saturation: -0.5, brightness: -0.28 },
      globeColor: "#081c25",
      dustColor: "#e1c17c",
      routeColor: "#d6aa5a",
      routeBrightness: 0.92,
    };
  }
  if (currentYear < 1945) {
    return {
      atmosphere: { hue: 0.1, saturation: -0.68, brightness: -0.38 },
      globeColor: "#0a1820",
      dustColor: "#bba765",
      routeColor: "#b88d46",
      routeBrightness: 0.68,
    };
  }
  return {
    atmosphere: { hue: 0.14, saturation: -0.45, brightness: -0.2 },
    globeColor: "#061c27",
    dustColor: "#79c2bd",
    routeColor: "#8ac0ad",
    routeBrightness: 0.76,
  };
}

function createMarkerImage() {
  const canvas = document.createElement("canvas");
  const size = 64;
  const center = size / 2;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const halo = context.createRadialGradient(center, center, 1, center, center, 30);
  halo.addColorStop(0, "rgba(255, 250, 226, 1)");
  halo.addColorStop(0.12, "rgba(255, 210, 116, 0.98)");
  halo.addColorStop(0.28, "rgba(236, 174, 72, 0.72)");
  halo.addColorStop(0.52, "rgba(211, 145, 48, 0.18)");
  halo.addColorStop(1, "rgba(211, 145, 48, 0)");

  context.fillStyle = halo;
  context.fillRect(0, 0, size, size);

  context.beginPath();
  context.arc(center, center, 10, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255, 220, 148, 0.55)";
  context.lineWidth = 1.5;
  context.stroke();

  context.beginPath();
  context.arc(center, center, 3.6, 0, Math.PI * 2);
  context.fillStyle = "#fff4ca";
  context.fill();

  return canvas;
}

function getMarkerScale(place: GlobePlace, selected: boolean) {
  if (selected) return 0.68;
  return 0.34 + (place.importance ?? 2) * 0.045;
}

function getStableMarkerBucket(id: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return (hash >>> 0) % 100;
}

function getRegionalRepresentativeIds(
  places: readonly GlobePlace[],
  longitudeCellSize: number,
  latitudeCellSize: number,
) {
  const representatives = new Map<
    string,
    { id: string; importance: number; bucket: number }
  >();

  for (const place of places) {
    const longitudeCell = Math.floor(
      (place.coordinates[0] + 180) / longitudeCellSize,
    );
    const latitudeCell = Math.floor(
      (place.coordinates[1] + 90) / latitudeCellSize,
    );
    const cellId = `${longitudeCell}:${latitudeCell}`;
    const candidate = {
      id: place.id,
      importance: place.importance ?? 0,
      bucket: getStableMarkerBucket(place.id),
    };
    const current = representatives.get(cellId);

    if (
      !current ||
      candidate.importance > current.importance ||
      (candidate.importance === current.importance &&
        candidate.bucket < current.bucket)
    ) {
      representatives.set(cellId, candidate);
    }
  }

  return new Set(Array.from(representatives.values(), ({ id }) => id));
}

function getLodVisiblePlaceIds(
  places: readonly GlobePlace[],
  cameraAltitude: number,
  profile: PerformanceProfile,
  minimalMode = false,
) {
  if (cameraAltitude <= LOCAL_MARKER_ALTITUDE) {
    return new Set(places.map(({ id }) => id));
  }

  const globalView = cameraAltitude >= GLOBAL_MARKER_ALTITUDE;
  const regionalView = cameraAltitude >= REGIONAL_MARKER_ALTITUDE;
  const representativeIds = getRegionalRepresentativeIds(
    places,
    globalView ? 60 : regionalView ? 35 : 22.5,
    globalView ? 45 : regionalView ? 30 : 20,
  );

  for (const place of places) {
    const importance = place.importance;
    const stableBucket = getStableMarkerBucket(place.id);
    const explicitlyImportant = globalView
      ? importance === 3
      : regionalView
        ? (importance ?? 0) >= 2
        : importance !== undefined;
    const sampledWithoutImportance =
      importance === undefined &&
      stableBucket < (globalView ? (minimalMode ? 4 : 10) : regionalView ? (minimalMode ? 24 : 38) : 72);

    if (explicitlyImportant || sampledWithoutImportance) {
      representativeIds.add(place.id);
    }
  }

  const [globalLimit, regionalLimit, localLimit] = profile.markerLimits;
  const profileMarkerLimit = globalView
    ? globalLimit
    : regionalView
      ? regionalLimit
      : localLimit;
  const markerLimit = minimalMode
    ? Math.min(profileMarkerLimit, globalView ? 6 : regionalView ? 16 : 40)
    : profileMarkerLimit;
  const rankedIds = Array.from(representativeIds).sort((leftId, rightId) => {
    const left = places.find(({ id }) => id === leftId);
    const right = places.find(({ id }) => id === rightId);
    const importanceDifference =
      (right?.importance ?? 0) - (left?.importance ?? 0);
    return importanceDifference !== 0
      ? importanceDifference
      : getStableMarkerBucket(leftId) - getStableMarkerBucket(rightId);
  });

  return new Set(rankedIds.slice(0, markerLimit));
}

function getSemanticRegion(longitude: number, latitude: number) {
  if (latitude <= -55) return "南极洲";
  if (latitude >= 66) return "北极圈";

  if (longitude < -30) {
    if (latitude >= 15) {
      if (longitude > -115 && latitude < 32) return "中美洲";
      return longitude < -100 ? "北美西部" : "北美东部";
    }
    return latitude >= -20 ? "南美北部" : "南美南部";
  }

  if (longitude < 35) {
    if (latitude >= 35) {
      if (longitude < 0) return "西欧";
      if (latitude >= 55) return "北欧";
      return longitude < 20 ? "南欧" : "东欧";
    }
    if (latitude >= 15) return "北非";
    if (latitude >= -12) return longitude < 18 ? "西非" : "东非";
    return "南部非洲";
  }

  if (longitude < 65) {
    if (latitude >= 23) return "西亚";
    return latitude >= -12 ? "东非" : "印度洋西部";
  }

  if (longitude < 95) {
    if (latitude >= 35) return "中亚";
    if (latitude >= 5) return "南亚";
    return "印度洋东部";
  }

  if (longitude < 125) {
    if (latitude >= 23) return "东亚";
    if (latitude >= -12) return "东南亚";
    return "澳洲西部";
  }

  if (longitude < 155) {
    if (latitude >= 20) return "东北亚";
    if (latitude >= -10) return "西太平洋";
    return "澳洲东部";
  }

  return latitude >= 0 ? "北太平洋" : "南太平洋";
}

function getPlaceClusters(
  places: readonly GlobePlace[],
  cameraAltitude: number,
  profile: PerformanceProfile,
) {
  if (cameraAltitude < REGIONAL_MARKER_ALTITUDE) {
    return [];
  }

  const globalView = cameraAltitude >= GLOBAL_MARKER_ALTITUDE;
  const minimumClusterSize = globalView ? 3 : 2;
  const [globalClusterLimit, regionalClusterLimit] = profile.clusterLimits;
  const maximumLabels = globalView
    ? globalClusterLimit
    : regionalClusterLimit;
  const cells = new Map<
    string,
    { count: number; longitudeTotal: number; latitudeTotal: number }
  >();

  for (const place of places) {
    const [longitude, latitude] = place.coordinates;
    const regionName = getSemanticRegion(longitude, latitude);
    const cell = cells.get(regionName);

    if (cell) {
      cell.count += 1;
      cell.longitudeTotal += longitude;
      cell.latitudeTotal += latitude;
    } else {
      cells.set(regionName, {
        count: 1,
        longitudeTotal: longitude,
        latitudeTotal: latitude,
      });
    }
  }

  return Array.from(cells, ([regionName, cell]) => ({
    regionName,
    count: cell.count,
    longitude: cell.longitudeTotal / cell.count,
    latitude: cell.latitudeTotal / cell.count,
  }))
    .filter(({ count }) => count >= minimumClusterSize)
    .sort((left, right) =>
      right.count === left.count
        ? left.regionName.localeCompare(right.regionName, "zh-CN")
        : right.count - left.count,
    )
    .slice(0, maximumLabels);
}

function updatePlaceClusters(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  collection: CesiumClusterCollection,
  places: readonly GlobePlace[],
  cameraAltitude: number,
  profile: PerformanceProfile,
  minimalMode = false,
) {
  collection.removeAll();

  const globalView = cameraAltitude >= GLOBAL_MARKER_ALTITUDE;
  for (const cluster of getPlaceClusters(places, cameraAltitude, profile).slice(0, minimalMode ? 3 : undefined)) {
    collection.add({
      id: {
        kind: "chrono-earth-cluster",
        regionName: cluster.regionName,
        longitude: cluster.longitude,
        latitude: cluster.latitude,
        targetAltitude: CLUSTER_FLY_TO_ALTITUDE,
        placeCount: cluster.count,
      } satisfies ClusterIdentity,
      position: Cesium.Cartesian3.fromDegrees(
        cluster.longitude,
        cluster.latitude,
        82_000,
      ),
      text: minimalMode ? `· ${cluster.regionName}` : `${cluster.regionName} ×${cluster.count}`,
      font: globalView
        ? `${minimalMode ? "500 11px" : "700 15px"} Inter, system-ui, sans-serif`
        : `${minimalMode ? "500 10px" : "700 13px"} Inter, system-ui, sans-serif`,
      fillColor: Cesium.Color.fromCssColorString("#edc983").withAlpha(minimalMode ? 0.52 : 0.92),
      outlineColor: Cesium.Color.fromCssColorString("#241607").withAlpha(0.88),
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      showBackground: !minimalMode,
      backgroundColor: Cesium.Color.fromCssColorString("#080704").withAlpha(
        globalView ? 0.68 : 0.62,
      ),
      backgroundPadding: new Cesium.Cartesian2(9, 5),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      pixelOffset: new Cesium.Cartesian2(0, -7),
      scaleByDistance: new Cesium.NearFarScalar(
        8_000_000,
        1.05,
        30_000_000,
        0.82,
      ),
      translucencyByDistance: new Cesium.NearFarScalar(
        8_000_000,
        0.98,
        36_000_000,
        0.62,
      ),
    });
  }

  viewer.scene.requestRender();
}

function updateHistoricalVoices(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  collection: CesiumVoiceCollection,
  voices: readonly GlobeVoice[],
  currentYear: number,
  cameraAltitude: number,
  profile: PerformanceProfile,
) {
  collection.removeAll();
  const limit = profile.tier === "high" ? 6 : profile.tier === "balanced" ? 4 : 2;
  const visibleVoices = [...voices]
    .map((voice) => ({ voice, distance: Math.abs(voice.year - currentYear) }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, limit);

  for (const { voice, distance } of visibleVoices) {
    const [longitude, latitude] = voice.coordinates;
    const alpha = Math.max(0.34, 0.9 - distance / 3200);
    const displayText = voice.text.length > 26 ? `${voice.text.slice(0, 24)}…` : voice.text;
    collection.add({
      id: {
        kind: "chrono-earth-voice",
        placeId: voice.placeId,
        voiceId: voice.id,
      } satisfies VoiceIdentity,
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 135_000),
      text: `${displayText}\n— ${voice.author}`,
      font: "400 12px Georgia, 'Songti SC', serif",
      fillColor: Cesium.Color.fromCssColorString("#f0d59b").withAlpha(alpha),
      outlineColor: Cesium.Color.fromCssColorString("#120d05").withAlpha(0.96),
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      showBackground: true,
      backgroundColor: Cesium.Color.fromCssColorString("#050706").withAlpha(0.56),
      backgroundPadding: new Cesium.Cartesian2(8, 5),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20),
      scaleByDistance: new Cesium.NearFarScalar(2_000_000, 1.06, 24_000_000, 0.72),
      translucencyByDistance: new Cesium.NearFarScalar(2_000_000, 1, 30_000_000, 0.48),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        1_200_000,
        Math.max(12_000_000, cameraAltitude * 1.5),
      ),
      disableDepthTestDistance: 0,
    });
  }
  viewer.scene.requestRender();
}

function getCameraAltitude(viewer: CesiumViewer) {
  const altitude = viewer.camera.positionCartographic.height;
  return Number.isFinite(altitude) ? altitude : GLOBAL_MARKER_ALTITUDE;
}

function getGlobalCameraAltitude() {
  const aspectRatio = window.innerWidth / Math.max(window.innerHeight, 1);

  if (aspectRatio < 0.9) return 16_500_000;
  if (aspectRatio < 1.25) return 18_500_000;
  return 21_500_000;
}

function getResolutionScale(profile = getPerformanceProfile()) {
  const devicePixelRatio = window.devicePixelRatio || 1;

  return Math.min(1, profile.targetPixelRatio / devicePixelRatio);
}

function applyPerformanceProfile(
  viewer: CesiumViewer,
  container: HTMLElement,
  profile: PerformanceProfile,
  performanceMode: PerformanceMode,
) {
  container.dataset.performanceTier = profile.tier;
  container.dataset.performanceMode = performanceMode;
  viewer.resolutionScale = getResolutionScale(profile);
  viewer.scene.msaaSamples = profile.msaaSamples;
  viewer.scene.globe.maximumScreenSpaceError =
    profile.maximumScreenSpaceError;
}

function getTemporalAlpha(place: GlobePlace, currentYear: number) {
  if (!place.period) {
    return 0.72;
  }

  const [start, end] = place.period;
  if (currentYear >= start && currentYear <= end) {
    return 1;
  }

  const distance =
    currentYear < start
      ? start - currentYear
      : currentYear - end;
  const proximity = Math.max(0, 1 - distance / PERIOD_FADE_YEARS);

  return FAR_FROM_PERIOD_ALPHA + proximity * 0.5;
}

function isMarkerIdentity(value: unknown): value is MarkerIdentity {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<MarkerIdentity>;
  return (
    candidate.kind === "chrono-earth-place" &&
    typeof candidate.placeId === "string"
  );
}

function isClusterIdentity(value: unknown): value is ClusterIdentity {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ClusterIdentity>;
  return (
    candidate.kind === "chrono-earth-cluster" &&
    typeof candidate.regionName === "string" &&
    typeof candidate.longitude === "number" &&
    typeof candidate.latitude === "number" &&
    typeof candidate.targetAltitude === "number" &&
    typeof candidate.placeCount === "number"
  );
}

function isVoiceIdentity(value: unknown): value is VoiceIdentity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<VoiceIdentity>;
  return (
    candidate.kind === "chrono-earth-voice" &&
    typeof candidate.placeId === "string" &&
    typeof candidate.voiceId === "string"
  );
}

function isRouteIdentity(value: unknown): value is RouteIdentity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RouteIdentity>;
  return (
    candidate.kind === "chrono-earth-route" &&
    typeof candidate.routeId === "string"
  );
}

function drawPlaces(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  previousCollection: CesiumMarkerCollection | null,
  markerImage: HTMLCanvasElement,
  places: readonly GlobePlace[],
  currentYear: number,
  cameraAltitude: number,
  profile: PerformanceProfile,
  selectedId?: string | null,
  minimalMode = false,
) {
  if (previousCollection && !viewer.isDestroyed()) {
    viewer.scene.primitives.remove(previousCollection);
  }

  const collection = viewer.scene.primitives.add(
    new Cesium.BillboardCollection(),
  );
  const lodVisiblePlaceIds = getLodVisiblePlaceIds(places, cameraAltitude, profile, minimalMode);

  for (const place of places) {
    const selected = place.id === selectedId;
    const alpha = getTemporalAlpha(place, currentYear);

    collection.add({
      id: {
        kind: "chrono-earth-place",
        placeId: place.id,
      } satisfies MarkerIdentity,
      position: Cesium.Cartesian3.fromDegrees(
        place.coordinates[0],
        place.coordinates[1],
        place.altitude ?? 350,
      ),
      image: markerImage,
      scale: getMarkerScale(place, selected),
      show:
        selected ||
        (lodVisiblePlaceIds.has(place.id) && alpha > FAR_FROM_PERIOD_ALPHA),
      color: Cesium.Color.WHITE.withAlpha(selected ? 1 : alpha),
      horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    });
  }

  viewer.scene.requestRender();
  return collection;
}

function updatePlaces(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  collection: CesiumMarkerCollection,
  markerImage: HTMLCanvasElement,
  places: readonly GlobePlace[],
  currentYear: number,
  cameraAltitude: number,
  profile: PerformanceProfile,
  selectedId?: string | null,
  minimalMode = false,
) {
  if (collection.length !== places.length) {
    return drawPlaces(
      Cesium,
      viewer,
      collection,
      markerImage,
      places,
      currentYear,
      cameraAltitude,
      profile,
      selectedId,
      minimalMode,
    );
  }

  const lodVisiblePlaceIds = getLodVisiblePlaceIds(places, cameraAltitude, profile, minimalMode);

  for (let index = 0; index < places.length; index += 1) {
    const place = places[index];
    const point = collection.get(index);
    const selected = place.id === selectedId;
    const alpha = getTemporalAlpha(place, currentYear);

    point.scale = getMarkerScale(place, selected);
    point.show =
      selected ||
      (lodVisiblePlaceIds.has(place.id) && alpha > FAR_FROM_PERIOD_ALPHA);
    point.color = Cesium.Color.WHITE.withAlpha(selected ? 1 : alpha);
  }

  viewer.scene.requestRender();
  return collection;
}

function updateTemporalDust(
  Cesium: CesiumModule,
  collection: CesiumDustCollection,
  currentYear: number,
  minimalMode = false,
) {
  const timePhase = currentYear * 0.017;
  const eraVisual = getEraVisual(currentYear);

  for (let index = 0; index < collection.length; index += 1) {
    const point = collection.get(index);
    const shimmer = 0.5 + 0.5 * Math.sin(timePhase + index * 2.399);
    point.pixelSize = minimalMode ? 0.9 + shimmer * 0.7 : 1.15 + shimmer * 1.45;
    point.color = Cesium.Color.fromCssColorString(eraVisual.dustColor).withAlpha(
      minimalMode ? 0.035 + shimmer * 0.09 : 0.08 + shimmer * 0.26,
    );
  }
}

function createTemporalDust(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  currentYear: number,
  profile = getPerformanceProfile(),
  minimalMode = false,
) {
  const collection = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection(),
  );
  collection.show = profile.showDust;
  const count = minimalMode ? Math.round(profile.dustCount * 0.35) : profile.dustCount;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const normalized = (index + 0.5) / count;
    const latitude = Cesium.Math.toDegrees(Math.asin(1 - 2 * normalized));
    const longitude =
      Cesium.Math.toDegrees(index * goldenAngle) % 360 - 180;
    const altitude =
      75_000 + ((index * 73_213) % 240_000) + Math.abs(latitude) * 900;

    collection.add({
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude),
      pixelSize: 2,
      color: Cesium.Color.fromCssColorString("#e7c277").withAlpha(0.2),
      disableDepthTestDistance: 0,
    });
  }

  updateTemporalDust(Cesium, collection, currentYear, minimalMode);
  return collection;
}

function getRouteAlpha(
  period: HistoryRoute["period"],
  currentYear: number,
) {
  const [start, end] = period;
  if (currentYear >= start && currentYear <= end) return 0.56;

  const distance =
    currentYear < start ? start - currentYear : currentYear - end;
  const proximity = Math.max(0, 1 - distance / ROUTE_FADE_YEARS);
  return 0.025 + proximity * 0.24;
}

function createArcPositions(
  Cesium: CesiumModule,
  waypoints: RouteWaypoints,
) {
  const positions: import("cesium").Cartesian3[] = [];

  for (let segment = 0; segment < waypoints.length - 1; segment += 1) {
    const [startLongitude, startLatitude] = waypoints[segment];
    const [endLongitude, endLatitude] = waypoints[segment + 1];
    let longitudeDelta = endLongitude - startLongitude;
    if (longitudeDelta > 180) longitudeDelta -= 360;
    if (longitudeDelta < -180) longitudeDelta += 360;

    const segmentSteps = 12;
    for (let step = segment === 0 ? 0 : 1; step <= segmentSteps; step += 1) {
      const progress = step / segmentSteps;
      const longitude = startLongitude + longitudeDelta * progress;
      const latitude =
        startLatitude + (endLatitude - startLatitude) * progress;
      const arcHeight = 22_000 + Math.sin(Math.PI * progress) * 115_000;
      positions.push(
        Cesium.Cartesian3.fromDegrees(longitude, latitude, arcHeight),
      );
    }
  }

  return positions;
}

function getRouteColor(
  Cesium: CesiumModule,
  category: HistoryRouteCategory,
  alpha: number,
  currentYear: number,
) {
  const eraVisual = getEraVisual(currentYear);
  const colors: Record<HistoryRouteCategory, string> = {
    trade: eraVisual.routeColor,
    migration: "#cfb878",
    pilgrimage: "#f0d7a0",
    conquest: "#c77850",
    sailing: "#75a9a3",
    knowledge: "#c6b4d7",
  };

  return Cesium.Color.fromCssColorString(colors[category]).withAlpha(
    alpha * eraVisual.routeBrightness,
  );
}

function updateHistoricalRoutes(
  Cesium: CesiumModule,
  collection: CesiumRouteCollection,
  currentYear: number,
  routeCategoryFilter?: HistoryRouteCategory | null,
  minimalMode = false,
  routeLensActive = false,
) {
  for (
    let index = 0;
    index < collection.length && index < historyRoutes.length;
    index += 1
  ) {
    const line = collection.get(index);
    const alpha = getRouteAlpha(
      historyRoutes[index].period,
      currentYear,
    );
    const matchesFilter =
      !routeCategoryFilter ||
      historyRoutes[index].category === routeCategoryFilter;
    const renderedAlpha = matchesFilter ? alpha : 0.025;
    line.show =
      minimalMode && !routeLensActive
        ? false
        : routeCategoryFilter
          ? true
          : alpha > 0.03;
    line.width = routeLensActive ? 2.1 : 1.25;
    line.material.uniforms.color = getRouteColor(
      Cesium,
      historyRoutes[index].category,
      Math.min(1, renderedAlpha * (routeLensActive ? 1.42 : 1)),
      currentYear,
    );
  }
}

function createHistoricalRoutes(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  places: readonly GlobePlace[],
  currentYear: number,
  routeCategoryFilter?: HistoryRouteCategory | null,
  minimalMode = false,
  routeLensActive = false,
) {
  const collection = viewer.scene.primitives.add(new Cesium.PolylineCollection());
  const placesById = new Map(places.map((place) => [place.id, place]));

  for (const route of historyRoutes) {
    const from = placesById.get(route.from);
    const to = placesById.get(route.to);
    if (!from || !to) continue;

    collection.add({
      id: {
        kind: "chrono-earth-route",
        routeId: route.id,
      } satisfies RouteIdentity,
      positions: createArcPositions(Cesium, [
        from.coordinates,
        to.coordinates,
      ]),
      width: 1.25,
      material: Cesium.Material.fromType("Color", {
        color: getRouteColor(Cesium, route.category, 0.2, currentYear),
      }),
    });
  }

  updateHistoricalRoutes(
    Cesium,
    collection,
    currentYear,
    routeCategoryFilter,
    minimalMode,
    routeLensActive,
  );
  return collection;
}

function createRouteParticles(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  places: readonly GlobePlace[],
) {
  const collection = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection(),
  );
  const placesById = new Map(places.map((place) => [place.id, place]));
  const entries: RouteParticleEntry[] = [];

  historyRoutes.forEach((route, routeIndex) => {
    const from = placesById.get(route.from);
    const to = placesById.get(route.to);
    if (!from || !to) return;
    const positions = createArcPositions(Cesium, [from.coordinates, to.coordinates]);
    const color = getRouteColor(Cesium, route.category, 0.96, 1453);
    const particles = [0, 1].map((tailIndex) =>
      collection.add({
        position: positions[0],
        pixelSize: tailIndex === 0 ? 5.2 : 2.6,
        color: color.withAlpha(tailIndex === 0 ? 0.92 : 0.28),
        outlineColor: Cesium.Color.fromCssColorString("#3b260e").withAlpha(0.7),
        outlineWidth: tailIndex === 0 ? 1 : 0,
        disableDepthTestDistance: 0,
        show: false,
      }),
    );
    entries.push({
      route,
      positions,
      particles,
      phase: ((routeIndex * 37) % 97) / 97,
    });
  });

  collection.show = false;
  return { collection, entries };
}

function updateRouteParticleVisibility(
  Cesium: CesiumModule,
  entries: readonly RouteParticleEntry[],
  currentYear: number,
  routeCategoryFilter?: HistoryRouteCategory | null,
) {
  for (const entry of entries) {
    const alpha = getRouteAlpha(entry.route.period, currentYear);
    const visible =
      alpha > 0.03 &&
      (!routeCategoryFilter || entry.route.category === routeCategoryFilter);
    const color = getRouteColor(
      Cesium,
      entry.route.category,
      Math.min(1, alpha * 1.65),
      currentYear,
    );
    entry.particles.forEach((particle, index) => {
      particle.show = visible;
      particle.color = color.withAlpha(index === 0 ? 0.95 : 0.3);
    });
  }
}

function getRouteView(
  routeId: string,
  places: readonly GlobePlace[],
): GlobeRouteView | null {
  const route = historyRoutes.find(({ id }) => id === routeId);
  const from = route ? places.find(({ id }) => id === route.from) : undefined;
  const to = route ? places.find(({ id }) => id === route.to) : undefined;
  if (!route || !from || !to) return null;
  return {
    id: route.id,
    label: route.label,
    category: route.category,
    period: route.period,
    fromId: from.id,
    fromName: from.name,
    toId: to.id,
    toName: to.name,
  };
}

function updateLandmarkConnections(
  Cesium: CesiumModule,
  collection: CesiumRouteCollection,
  places: readonly GlobePlace[],
  placeId: string | null,
  currentYear: number,
) {
  collection.removeAll();
  if (!placeId) return;
  const placesById = new Map(places.map((place) => [place.id, place]));
  const relatedRoutes = historyRoutes
    .filter(({ from, to }) => from === placeId || to === placeId)
    .sort(
      (left, right) =>
        getRouteAlpha(right.period, currentYear) -
        getRouteAlpha(left.period, currentYear),
    )
    .slice(0, 3);

  for (const route of relatedRoutes) {
    const from = placesById.get(route.from);
    const to = placesById.get(route.to);
    if (!from || !to) continue;
    const positions = createArcPositions(Cesium, [from.coordinates, to.coordinates]);
    const alpha = Math.min(0.48, 0.12 + getRouteAlpha(route.period, currentYear) * 0.55);
    collection.add({
      positions,
      width: 3.6,
      material: Cesium.Material.fromType("Color", {
        color: Cesium.Color.fromCssColorString("#24180a").withAlpha(alpha * 0.7),
      }),
    });
    collection.add({
      positions,
      width: 1.1,
      material: Cesium.Material.fromType("Color", {
        color: getRouteColor(Cesium, route.category, alpha, currentYear),
      }),
    });
  }
}

function updateEraAtmosphere(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  currentYear: number,
  minimalMode = false,
) {
  const visual = getEraVisual(currentYear);
  viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString(
    minimalMode ? "#100d08" : visual.globeColor,
  );

  const atmosphere = viewer.scene.skyAtmosphere;
  if (atmosphere) {
    atmosphere.hueShift = minimalMode ? 0.08 : visual.atmosphere.hue;
    atmosphere.saturationShift = minimalMode ? -0.72 : visual.atmosphere.saturation;
    atmosphere.brightnessShift = minimalMode ? -0.3 : visual.atmosphere.brightness;
  }
}

function flyToPlace(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  place: GlobePlace | undefined,
) {
  if (!place || viewer.isDestroyed()) {
    return;
  }

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      place.coordinates[0],
      place.coordinates[1],
      3_800_000,
    ),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 1.8,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
  });
}

function setOpeningView(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  place: GlobePlace | undefined,
) {
  if (!place || viewer.isDestroyed()) return;
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      place.coordinates[0],
      place.coordinates[1],
      window.innerWidth < 700 ? 3_050_000 : 2_300_000,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(-8),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });
  viewer.scene.requestRender();
}

function updateOpeningBeacon(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  existing: CesiumEntity | null,
  place: GlobePlace | undefined,
  phase: "boot" | "focus" | "depart" | "done",
) {
  if (viewer.isDestroyed()) return null;
  if (existing) viewer.entities.remove(existing);
  if (!place) return null;

  const [longitude, latitude] = place.coordinates;
  const isNear = phase === "boot" || phase === "focus";
  const isAfterglow = phase === "done";
  const beamHeight = isNear ? 1_800_000 : 420_000;
  const anchorPosition = Cesium.Cartesian3.fromDegrees(
    longitude,
    latitude,
    18_000,
  );

  const beacon = viewer.entities.add({
    position: anchorPosition,
    point: {
      pixelSize: isAfterglow ? 5 : 7,
      color: Cesium.Color.fromCssColorString("#f1c778").withAlpha(
        isAfterglow ? 0.78 : 1,
      ),
      outlineColor: Cesium.Color.fromCssColorString("#6a4317").withAlpha(0.9),
      outlineWidth: 2,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    ...(!isAfterglow
      ? {
          polyline: {
            positions: [
              anchorPosition,
              Cesium.Cartesian3.fromDegrees(longitude, latitude, beamHeight),
            ],
            width: isNear ? 1.5 : 1,
            material: Cesium.Color.fromCssColorString("#edbd68").withAlpha(
              isNear ? 0.54 : 0.3,
            ),
            arcType: Cesium.ArcType.NONE,
          },
        }
      : {}),
  });

  viewer.scene.requestRender();
  return beacon;
}

function flyToGlobal(Cesium: CesiumModule, viewer: CesiumViewer, duration = 2.8) {
  if (viewer.isDestroyed()) return;
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(18, 25, getGlobalCameraAltitude()),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration,
    easingFunction: Cesium.EasingFunction.QUINTIC_IN_OUT,
  });
}

function flyToCluster(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  cluster: ClusterIdentity,
) {
  if (viewer.isDestroyed()) {
    return;
  }

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      cluster.longitude,
      cluster.latitude,
      cluster.targetAltitude,
    ),
    orientation: {
      heading: 0,
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
    duration: 1.65,
    easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
  });
}

export function GlobeScene({
  places,
  voices = [],
  currentYear,
  selectedId,
  routeCategoryFilter,
  minimalMode = false,
  routeLensActive = false,
  landmarkLensActive = false,
  openingPlaceId = null,
  openingPhase = "done",
  performanceMode = "auto",
  enabled = true,
  onSelect,
  onPerformanceTierChange,
  onCameraSettled,
  onClusterExpand,
  onRuntimePerformance,
  onRouteHover,
  onRouteSelect,
  onPlaceHover,
}: GlobeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const pointsRef = useRef<CesiumMarkerCollection | null>(null);
  const clustersRef = useRef<CesiumClusterCollection | null>(null);
  const voicesRef = useRef(voices);
  const voiceLabelsRef = useRef<CesiumVoiceCollection | null>(null);
  const dustRef = useRef<CesiumDustCollection | null>(null);
  const routesRef = useRef<CesiumRouteCollection | null>(null);
  const landmarkConnectionsRef = useRef<CesiumRouteCollection | null>(null);
  const routeParticlesRef = useRef<CesiumRouteParticleCollection | null>(null);
  const routeParticleEntriesRef = useRef<readonly RouteParticleEntry[]>([]);
  const openingBeaconRef = useRef<CesiumEntity | null>(null);
  const markerImageRef = useRef<HTMLCanvasElement | null>(null);
  const performanceProfileRef = useRef<PerformanceProfile | null>(null);
  const placesRef = useRef(places);
  const yearRef = useRef(currentYear);
  const selectedIdRef = useRef(selectedId);
  const routeCategoryFilterRef = useRef(routeCategoryFilter);
  const minimalModeRef = useRef(minimalMode);
  const routeLensActiveRef = useRef(routeLensActive);
  const landmarkLensActiveRef = useRef(landmarkLensActive);
  const hoveredPlaceIdRef = useRef<string | null>(null);
  const openingPlaceIdRef = useRef(openingPlaceId);
  const openingPhaseRef = useRef(openingPhase);
  const onSelectRef = useRef(onSelect);
  const onPerformanceTierChangeRef = useRef(onPerformanceTierChange);
  const onCameraSettledRef = useRef(onCameraSettled);
  const onClusterExpandRef = useRef(onClusterExpand);
  const onRuntimePerformanceRef = useRef(onRuntimePerformance);
  const onRouteHoverRef = useRef(onRouteHover);
  const onRouteSelectRef = useRef(onRouteSelect);
  const onPlaceHoverRef = useRef(onPlaceHover);

  useEffect(() => {
    placesRef.current = places;
    voicesRef.current = voices;
    yearRef.current = currentYear;
    selectedIdRef.current = selectedId;
    routeCategoryFilterRef.current = routeCategoryFilter;
    minimalModeRef.current = minimalMode;
    routeLensActiveRef.current = routeLensActive;
    landmarkLensActiveRef.current = landmarkLensActive;
    openingPlaceIdRef.current = openingPlaceId;
    openingPhaseRef.current = openingPhase;
    onSelectRef.current = onSelect;
    onPerformanceTierChangeRef.current = onPerformanceTierChange;
    onCameraSettledRef.current = onCameraSettled;
    onClusterExpandRef.current = onClusterExpand;
    onRuntimePerformanceRef.current = onRuntimePerformance;
    onRouteHoverRef.current = onRouteHover;
    onRouteSelectRef.current = onRouteSelect;
    onPlaceHoverRef.current = onPlaceHover;
  }, [
    places,
    voices,
    currentYear,
    selectedId,
    routeCategoryFilter,
    minimalMode,
    routeLensActive,
    landmarkLensActive,
    openingPlaceId,
    openingPhase,
    onSelect,
    onPerformanceTierChange,
    onCameraSettled,
    onClusterExpand,
    onRuntimePerformance,
    onRouteHover,
    onRouteSelect,
    onPlaceHover,
  ]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    let inputHandler: import("cesium").ScreenSpaceEventHandler | null = null;
    let imageryFadeFrame: number | null = null;
    let resizeHandler: (() => void) | null = null;
    let removeCameraMoveEndListener: (() => void) | null = null;
    let removeCameraMoveStartListener: (() => void) | null = null;
    let removePostRenderListener: (() => void) | null = null;
    let motionPreferenceQuery: MediaQueryList | null = null;
    let interactionContainer: HTMLDivElement | null = null;
    let userCameraInputAt = 0;
    const markUserCameraInput = () => {
      userCameraInputAt = window.performance.now();
    };

    async function initialise() {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const Cesium = await import("cesium");
      if (cancelled || !containerRef.current) {
        return;
      }
      let performanceProfile = getPerformanceProfile(performanceMode);
      performanceProfileRef.current = performanceProfile;
      let movementStartedAt = 0;
      let renderedFramesDuringMovement = 0;
      let lowFpsStreak = 0;
      interactionContainer = container;
      container.addEventListener("pointerdown", markUserCameraInput, { passive: true });
      container.addEventListener("wheel", markUserCameraInput, { passive: true });

      let naturalEarthLayer: import("cesium").ImageryLayer | false = false;
      try {
        const naturalEarthProvider =
          await Cesium.TileMapServiceImageryProvider.fromUrl(
            "/cesium/Assets/Textures/NaturalEarthII",
          );
        naturalEarthLayer = new Cesium.ImageryLayer(naturalEarthProvider);
        naturalEarthLayer.brightness = 0.4;
        naturalEarthLayer.contrast = 1.48;
        naturalEarthLayer.saturation = 0.05;
        naturalEarthLayer.gamma = 0.92;
        naturalEarthLayer.hue = 0.06;
      } catch {
        // A dark ellipsoid remains usable if the host has not copied Cesium assets.
      }

      const viewer = new Cesium.Viewer(container, {
        animation: false,
        baseLayer: naturalEarthLayer,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        shouldAnimate: false,
        useBrowserRecommendedResolution: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Number.POSITIVE_INFINITY,
      });

      if (cancelled) {
        viewer.destroy();
        return;
      }

      cesiumRef.current = Cesium;
      viewerRef.current = viewer;
      markerImageRef.current = createMarkerImage();

      viewer.scene.backgroundColor =
        Cesium.Color.fromCssColorString("#010202");
      viewer.scene.globe.enableLighting = false;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.dynamicAtmosphereLighting = false;
      viewer.scene.globe.dynamicAtmosphereLightingFromSun = false;
      viewer.scene.fog.enabled = false;
      viewer.scene.highDynamicRange = false;
      applyPerformanceProfile(
        viewer,
        container,
        performanceProfile,
        performanceMode,
      );
      onPerformanceTierChangeRef.current?.(performanceProfile.tier);
      updateEraAtmosphere(Cesium, viewer, yearRef.current, minimalModeRef.current);

      const controller = viewer.scene.screenSpaceCameraController;
      controller.enableCollisionDetection = true;
      controller.minimumZoomDistance = 1_250_000;
      controller.maximumZoomDistance = 42_000_000;
      controller.inertiaSpin = 0.9;
      controller.inertiaTranslate = 0.85;
      controller.inertiaZoom = 0.82;

      const openingPlace = placesRef.current.find(
        ({ id }) => id === openingPlaceIdRef.current,
      );
      if (openingPlace && openingPhaseRef.current !== "done") {
        setOpeningView(Cesium, viewer, openingPlace);
      } else {
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            18,
            25,
            getGlobalCameraAltitude(),
          ),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
          },
        });
      }
      openingBeaconRef.current = updateOpeningBeacon(
        Cesium,
        viewer,
        openingBeaconRef.current,
        openingPlace,
        openingPhaseRef.current,
      );

      resizeHandler = () => {
        const nextProfile = getPerformanceProfile(performanceMode);
        const tierChanged = nextProfile.tier !== performanceProfile.tier;
        applyPerformanceProfile(viewer, container, nextProfile, performanceMode);

        if (tierChanged) {
          const previousDust = dustRef.current;
          if (previousDust) {
            viewer.scene.primitives.remove(previousDust);
            dustRef.current = createTemporalDust(
              Cesium,
              viewer,
              yearRef.current,
              nextProfile,
              minimalModeRef.current,
            );
          }

          const collection = pointsRef.current;
          const markerImage = markerImageRef.current;
          if (collection && markerImage) {
            pointsRef.current = updatePlaces(
              Cesium,
              viewer,
              collection,
              markerImage,
              placesRef.current,
              yearRef.current,
              getCameraAltitude(viewer),
              nextProfile,
              selectedIdRef.current,
              minimalModeRef.current,
            );
          }
          if (clustersRef.current) {
            updatePlaceClusters(
              Cesium,
              viewer,
              clustersRef.current,
              placesRef.current,
              getCameraAltitude(viewer),
              nextProfile,
              minimalModeRef.current,
            );
          }
        }

        performanceProfile = nextProfile;
        performanceProfileRef.current = nextProfile;
        onPerformanceTierChangeRef.current?.(nextProfile.tier);
        viewer.scene.requestRender();
      };
      window.addEventListener("resize", resizeHandler, { passive: true });
      motionPreferenceQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      motionPreferenceQuery.addEventListener("change", resizeHandler);

      routesRef.current = createHistoricalRoutes(
        Cesium,
        viewer,
        placesRef.current,
        yearRef.current,
        routeCategoryFilterRef.current,
        minimalModeRef.current,
        routeLensActiveRef.current,
      );
      landmarkConnectionsRef.current = viewer.scene.primitives.add(
        new Cesium.PolylineCollection(),
      );
      const routeParticles = createRouteParticles(
        Cesium,
        viewer,
        placesRef.current,
      );
      routeParticlesRef.current = routeParticles.collection;
      routeParticleEntriesRef.current = routeParticles.entries;
      dustRef.current = createTemporalDust(
        Cesium,
        viewer,
        yearRef.current,
        performanceProfile,
        minimalModeRef.current,
      );
      pointsRef.current = drawPlaces(
        Cesium,
        viewer,
        null,
        markerImageRef.current,
        placesRef.current,
        yearRef.current,
        getCameraAltitude(viewer),
        performanceProfile,
        selectedIdRef.current,
        minimalModeRef.current,
      );
      const clusters = viewer.scene.primitives.add(
        new Cesium.LabelCollection(),
      );
      clustersRef.current = clusters;
      updatePlaceClusters(
        Cesium,
        viewer,
        clusters,
        placesRef.current,
        getCameraAltitude(viewer),
        performanceProfile,
        minimalModeRef.current,
      );
      const voiceLabels = viewer.scene.primitives.add(
        new Cesium.LabelCollection(),
      );
      voiceLabelsRef.current = voiceLabels;
      updateHistoricalVoices(
        Cesium,
        viewer,
        voiceLabels,
        voicesRef.current,
        yearRef.current,
        getCameraAltitude(viewer),
        performanceProfile,
      );
      removeCameraMoveStartListener = viewer.camera.moveStart.addEventListener(
        () => {
          const now = window.performance.now();
          // Opening flights, random destinations, and other cinematic camera
          // moves are intentionally paced and are not valid FPS samples.
          movementStartedAt = now - userCameraInputAt < 500 ? now : 0;
          renderedFramesDuringMovement = 0;
          container.dataset.interacting = "true";
        },
      );
      removePostRenderListener = viewer.scene.postRender.addEventListener(() => {
        if (movementStartedAt > 0) renderedFramesDuringMovement += 1;
      });
      removeCameraMoveEndListener = viewer.camera.moveEnd.addEventListener(
        () => {
          container.dataset.interacting = "false";
          const collection = pointsRef.current;
          const markerImage = markerImageRef.current;
          if (!collection || !markerImage || viewer.isDestroyed()) {
            return;
          }

          let adapted = false;
          if (movementStartedAt > 0) {
            const duration = window.performance.now() - movementStartedAt;
            if (duration >= 650) {
              const fps = Math.round(
                (renderedFramesDuringMovement * 1000) / Math.max(duration, 1),
              );
              container.dataset.runtimeFps = String(fps);
              if (performanceMode === "auto") {
                lowFpsStreak = fps < 42 ? lowFpsStreak + 1 : 0;
                if (lowFpsStreak >= 2 && performanceProfile.tier !== "low") {
                  performanceProfile = getPerformanceProfile(
                    getLowerPerformanceTier(performanceProfile.tier),
                  );
                  performanceProfileRef.current = performanceProfile;
                  applyPerformanceProfile(
                    viewer,
                    container,
                    performanceProfile,
                    performanceMode,
                  );
                  if (dustRef.current) {
                    dustRef.current.show = performanceProfile.showDust;
                  }
                  lowFpsStreak = 0;
                  adapted = true;
                  onPerformanceTierChangeRef.current?.(performanceProfile.tier);
                }
              }
              onRuntimePerformanceRef.current?.({
                fps,
                tier: performanceProfile.tier,
                adapted,
              });
            }
            movementStartedAt = 0;
          }

          pointsRef.current = updatePlaces(
            Cesium,
            viewer,
            collection,
            markerImage,
            placesRef.current,
            yearRef.current,
            getCameraAltitude(viewer),
            performanceProfile,
            selectedIdRef.current,
            minimalModeRef.current,
          );
          if (clustersRef.current) {
            updatePlaceClusters(
              Cesium,
              viewer,
              clustersRef.current,
              placesRef.current,
              getCameraAltitude(viewer),
              performanceProfile,
              minimalModeRef.current,
            );
          }
          if (voiceLabelsRef.current) {
            updateHistoricalVoices(
              Cesium,
              viewer,
              voiceLabelsRef.current,
              voicesRef.current,
              yearRef.current,
              getCameraAltitude(viewer),
              performanceProfile,
            );
          }
          const cameraPosition = viewer.camera.positionCartographic;
          onCameraSettledRef.current?.({
            longitude: Cesium.Math.toDegrees(cameraPosition.longitude),
            latitude: Cesium.Math.toDegrees(cameraPosition.latitude),
            altitudeKm: cameraPosition.height / 1000,
          });
          viewer.scene.requestRender();
        },
      );
      flyToPlace(
        Cesium,
        viewer,
        placesRef.current.find(
          (place) => place.id === selectedIdRef.current,
        ),
      );

      // Keep the bundled Natural Earth tiles as an instant/offline fallback,
      // then replace them with an adaptive NASA Blue Marble texture. Most
      // displays use 4K to reduce GPU memory; the high tier keeps 8K.
      void Cesium.SingleTileImageryProvider.fromUrl(
        performanceProfile.textureUrl,
      )
        .then((provider) => {
          if (cancelled || viewer.isDestroyed()) return;

          const highResolutionLayer =
            viewer.imageryLayers.addImageryProvider(provider);
          highResolutionLayer.alpha = 0;
          highResolutionLayer.brightness = 0.52;
          highResolutionLayer.contrast = 1.12;
          highResolutionLayer.saturation = 0.08;
          highResolutionLayer.gamma = 1;
          highResolutionLayer.hue = 0.08;

          const fadeStartedAt = window.performance.now();
          const fadeDuration = 900;
          const fadeIn = (now: number) => {
            if (cancelled || viewer.isDestroyed()) return;

            const progress = Math.min(1, (now - fadeStartedAt) / fadeDuration);
            highResolutionLayer.alpha = progress;
            if (naturalEarthLayer) naturalEarthLayer.alpha = 1 - progress;
            viewer.scene.requestRender();

            if (progress < 1) {
              imageryFadeFrame = window.requestAnimationFrame(fadeIn);
            } else if (naturalEarthLayer) {
              viewer.imageryLayers.remove(naturalEarthLayer, true);
              naturalEarthLayer = false;
            }
          };

          imageryFadeFrame = window.requestAnimationFrame(fadeIn);
        })
        .catch(() => {
          // Low-memory devices and failed asset loads keep the bundled layer.
        });

      inputHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      inputHandler.setInputAction(
        (movement: { position: import("cesium").Cartesian2 }) => {
          const picked = viewer.scene.pick(movement.position) as
            | { id?: unknown; primitive?: { id?: unknown } }
            | undefined;
          const identity = picked?.id ?? picked?.primitive?.id;

          if (isRouteIdentity(identity) && routeLensActiveRef.current) {
            const route = getRouteView(identity.routeId, placesRef.current);
            if (route) onRouteSelectRef.current?.(route);
          } else if (isMarkerIdentity(identity)) {
            onSelectRef.current(identity.placeId);
          } else if (isVoiceIdentity(identity)) {
            onSelectRef.current(identity.placeId);
          } else if (isClusterIdentity(identity)) {
            onClusterExpandRef.current?.({
              regionName: identity.regionName,
              placeCount: identity.placeCount,
            });
            flyToCluster(Cesium, viewer, identity);
          }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK,
      );
      let hoveredRouteId: string | null = null;
      inputHandler.setInputAction(
        (movement: { endPosition: import("cesium").Cartesian2 }) => {
          if (!routeLensActiveRef.current && !landmarkLensActiveRef.current) {
            if (hoveredRouteId) onRouteHoverRef.current?.(null);
            if (hoveredPlaceIdRef.current) onPlaceHoverRef.current?.(null);
            hoveredRouteId = null;
            hoveredPlaceIdRef.current = null;
            container.dataset.routeHover = "false";
            container.dataset.placeHover = "false";
            landmarkConnectionsRef.current?.removeAll();
            return;
          }

          const picked = viewer.scene.pick(movement.endPosition) as
            | { id?: unknown; primitive?: { id?: unknown } }
            | undefined;
          const identity = picked?.id ?? picked?.primitive?.id;
          if (routeLensActiveRef.current) {
            const nextRouteId = isRouteIdentity(identity) ? identity.routeId : null;
            if (nextRouteId !== hoveredRouteId) {
              hoveredRouteId = nextRouteId;
              container.dataset.routeHover = nextRouteId ? "true" : "false";
              onRouteHoverRef.current?.(
                nextRouteId ? getRouteView(nextRouteId, placesRef.current) : null,
              );
            }
            if (hoveredPlaceIdRef.current) onPlaceHoverRef.current?.(null);
            hoveredPlaceIdRef.current = null;
            container.dataset.placeHover = "false";
            landmarkConnectionsRef.current?.removeAll();
            return;
          }

          const nextPlaceId = isMarkerIdentity(identity) ? identity.placeId : null;
          if (nextPlaceId === hoveredPlaceIdRef.current) return;
          hoveredPlaceIdRef.current = nextPlaceId;
          container.dataset.placeHover = nextPlaceId ? "true" : "false";
          onPlaceHoverRef.current?.(nextPlaceId);
          if (landmarkConnectionsRef.current) {
            updateLandmarkConnections(
              Cesium,
              landmarkConnectionsRef.current,
              placesRef.current,
              nextPlaceId,
              yearRef.current,
            );
          }
          viewer.scene.requestRender();
        },
        Cesium.ScreenSpaceEventType.MOUSE_MOVE,
      );

      // Cesium's widget stylesheet may be loaded globally by the host app. These
      // inline fallbacks keep its canvas usable while the module is standalone.
      Object.assign((viewer.container as HTMLElement).style, {
        width: "100%",
        height: "100%",
        overflow: "hidden",
      });
      Object.assign(viewer.scene.canvas.style, {
        display: "block",
        width: "100%",
        height: "100%",
        touchAction: "none",
      });
      Object.assign(
        (viewer.cesiumWidget.creditContainer as HTMLElement).style,
        {
        position: "absolute",
        right: "8px",
        bottom: "6px",
        zIndex: "2",
        color: "rgba(255,255,255,.55)",
        fontSize: "10px",
        },
      );
    }

    void initialise();

    return () => {
      interactionContainer?.removeEventListener("pointerdown", markUserCameraInput);
      interactionContainer?.removeEventListener("wheel", markUserCameraInput);
      cancelled = true;
      if (imageryFadeFrame !== null) {
        window.cancelAnimationFrame(imageryFadeFrame);
      }
      inputHandler?.destroy();
      inputHandler = null;
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        motionPreferenceQuery?.removeEventListener("change", resizeHandler);
        resizeHandler = null;
      }
      motionPreferenceQuery = null;
      removeCameraMoveEndListener?.();
      removeCameraMoveEndListener = null;
      removeCameraMoveStartListener?.();
      removeCameraMoveStartListener = null;
      removePostRenderListener?.();
      removePostRenderListener = null;
      pointsRef.current = null;
      clustersRef.current = null;
      voiceLabelsRef.current = null;
      dustRef.current = null;
      routesRef.current = null;
      landmarkConnectionsRef.current = null;
      routeParticlesRef.current = null;
      routeParticleEntriesRef.current = [];
      openingBeaconRef.current = null;
      markerImageRef.current = null;
      performanceProfileRef.current = null;
      cesiumRef.current = null;

      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, [enabled, performanceMode]);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    const markerImage = markerImageRef.current;
    if (!Cesium || !viewer || !markerImage || viewer.isDestroyed()) {
      return;
    }
    const performanceProfile =
      performanceProfileRef.current ?? getPerformanceProfile(performanceMode);

    pointsRef.current = pointsRef.current
      ? updatePlaces(
          Cesium,
          viewer,
          pointsRef.current,
          markerImage,
          places,
          currentYear,
          getCameraAltitude(viewer),
          performanceProfile,
          selectedId,
          minimalMode,
        )
      : drawPlaces(
          Cesium,
          viewer,
          null,
          markerImage,
          places,
          currentYear,
          getCameraAltitude(viewer),
          performanceProfile,
          selectedId,
          minimalMode,
        );

    if (dustRef.current) {
      updateTemporalDust(Cesium, dustRef.current, currentYear, minimalMode);
    }
    if (routesRef.current) {
      updateHistoricalRoutes(
        Cesium,
        routesRef.current,
        currentYear,
        routeCategoryFilter,
        minimalMode,
        routeLensActive,
      );
    }
    if (voiceLabelsRef.current) {
      updateHistoricalVoices(
        Cesium,
        viewer,
        voiceLabelsRef.current,
        voices,
        currentYear,
        getCameraAltitude(viewer),
        performanceProfile,
      );
    }
    updateEraAtmosphere(Cesium, viewer, currentYear, minimalMode);
    viewer.scene.requestRender();
  }, [places, voices, currentYear, selectedId, routeCategoryFilter, performanceMode, minimalMode, routeLensActive]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    const collection = landmarkConnectionsRef.current;
    if (!viewer || viewer.isDestroyed() || !Cesium || !collection) return;

    if (!landmarkLensActive) {
      hoveredPlaceIdRef.current = null;
      onPlaceHoverRef.current?.(null);
      collection.removeAll();
      if (containerRef.current) containerRef.current.dataset.placeHover = "false";
    } else if (hoveredPlaceIdRef.current) {
      updateLandmarkConnections(
        Cesium,
        collection,
        places,
        hoveredPlaceIdRef.current,
        currentYear,
      );
    }
    viewer.scene.requestRender();
  }, [currentYear, landmarkLensActive, places]);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    const clusters = clustersRef.current;
    if (!Cesium || !viewer || !clusters || viewer.isDestroyed()) {
      return;
    }
    const performanceProfile =
      performanceProfileRef.current ?? getPerformanceProfile(performanceMode);

    updatePlaceClusters(
      Cesium,
      viewer,
      clusters,
      places,
      getCameraAltitude(viewer),
      performanceProfile,
      minimalMode,
    );
  }, [places, performanceMode, minimalMode]);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || viewer.isDestroyed()) {
      return;
    }

    if (openingPhase !== "done") return;
    flyToPlace(
      Cesium,
      viewer,
      places.find((place) => place.id === selectedId),
    );
  }, [openingPhase, places, selectedId]);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || viewer.isDestroyed()) return;

    openingBeaconRef.current = updateOpeningBeacon(
      Cesium,
      viewer,
      openingBeaconRef.current,
      places.find(({ id }) => id === openingPlaceId),
      openingPhase,
    );

    if (openingPhase === "focus") {
      setOpeningView(
        Cesium,
        viewer,
        places.find(({ id }) => id === openingPlaceId),
      );
    } else if (openingPhase === "depart") {
      flyToGlobal(Cesium, viewer, 2.8);
    } else if (openingPhase === "done" && openingPlaceId) {
      flyToGlobal(Cesium, viewer, 0);
    }
  }, [openingPhase, openingPlaceId, places]);

  useEffect(() => {
    if (!selectedId) return;
    const viewer = viewerRef.current;
    const beacon = openingBeaconRef.current;
    if (!viewer || viewer.isDestroyed() || !beacon) return;

    viewer.entities.remove(beacon);
    openingBeaconRef.current = null;
    viewer.scene.requestRender();
  }, [selectedId]);

  useEffect(() => {
    if (openingPhase !== "done" || !openingPlaceId) return;

    const timer = window.setTimeout(() => {
      const viewer = viewerRef.current;
      const beacon = openingBeaconRef.current;
      if (!viewer || viewer.isDestroyed() || !beacon) return;
      viewer.entities.remove(beacon);
      openingBeaconRef.current = null;
      viewer.scene.requestRender();
    }, 4_200);

    return () => window.clearTimeout(timer);
  }, [openingPhase, openingPlaceId]);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    const collection = routeParticlesRef.current;
    if (!Cesium || !viewer || !collection || viewer.isDestroyed()) return;

    collection.show = routeLensActive;
    updateRouteParticleVisibility(
      Cesium,
      routeParticleEntriesRef.current,
      currentYear,
      routeCategoryFilter,
    );
    if (!routeLensActive) onRouteHoverRef.current?.(null);
    viewer.scene.requestRender();
  }, [currentYear, routeCategoryFilter, routeLensActive]);

  useEffect(() => {
    if (!routeLensActive || !enabled) return;
    let animationFrame: number | null = null;
    let lastRenderedAt = 0;

    const animate = (now: number) => {
      animationFrame = window.requestAnimationFrame(animate);
      if (now - lastRenderedAt < 34) return;

      const viewer = viewerRef.current;
      const collection = routeParticlesRef.current;
      if (!viewer || viewer.isDestroyed() || !collection) return;
      const lowTier = performanceProfileRef.current?.tier === "low";
      collection.show = !lowTier;
      if (lowTier) return;

      lastRenderedAt = now;
      const travelTime = now / 1000;
      routeParticleEntriesRef.current.forEach((entry) => {
        entry.particles.forEach((particle, tailIndex) => {
          if (!particle.show || entry.positions.length === 0) return;
          const progress =
            (travelTime * 0.045 + entry.phase - tailIndex * 0.028 + 1) % 1;
          const positionIndex = Math.min(
            entry.positions.length - 1,
            Math.floor(progress * entry.positions.length),
          );
          particle.position = entry.positions[positionIndex];
        });
      });
      viewer.scene.requestRender();
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, [enabled, routeLensActive]);

  useEffect(() => {
    if (!landmarkLensActive || !enabled) return;
    let animationFrame: number | null = null;
    let lastRenderedAt = 0;

    const animate = (now: number) => {
      animationFrame = window.requestAnimationFrame(animate);
      if (now - lastRenderedAt < 80) return;

      const viewer = viewerRef.current;
      const collection = pointsRef.current;
      if (!viewer || viewer.isDestroyed() || !collection) return;
      lastRenderedAt = now;
      const lowTier = performanceProfileRef.current?.tier === "low";

      for (let index = 0; index < placesRef.current.length; index += 1) {
        const place = placesRef.current[index];
        const point = collection.get(index);
        if (!point) continue;
        const baseScale = getMarkerScale(
          place,
          place.id === selectedIdRef.current,
        );
        const resonates =
          point.show &&
          !lowTier &&
          (place.importance ?? 2) >= 2 &&
          getTemporalAlpha(place, yearRef.current) > 0.55;
        point.scale = resonates
          ? baseScale * (1 + Math.sin(now / 760 + index * 1.71) * 0.065)
          : baseScale;
      }
      viewer.scene.requestRender();
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      const collection = pointsRef.current;
      if (!collection) return;
      for (let index = 0; index < placesRef.current.length; index += 1) {
        const point = collection.get(index);
        if (point) {
          const place = placesRef.current[index];
          point.scale = getMarkerScale(
            place,
            place.id === selectedIdRef.current,
          );
        }
      }
    };
  }, [enabled, landmarkLensActive]);

  return (
    <div
      ref={containerRef}
      className="globe-canvas"
      aria-label="可拖动旋转的历史景点三维地球"
      style={{
        position: "absolute",
        inset: 0,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 45%, #0a1a29 0%, #030712 42%, #01030a 100%)",
      }}
    />
  );
}

export default GlobeScene;
