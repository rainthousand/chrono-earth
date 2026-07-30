"use client";

import { useEffect, useRef } from "react";

type CesiumModule = typeof import("cesium");
type CesiumViewer = import("cesium").Viewer;
type CesiumPointCollection = import("cesium").PointPrimitiveCollection;

export interface GlobePlace {
  id: string;
  name: string;
  coordinates: readonly [longitude: number, latitude: number];
  altitude?: number;
  importance?: 1 | 2 | 3;
  period?: readonly [startYear: number, endYear: number];
}

export interface GlobeSceneProps {
  places: readonly GlobePlace[];
  currentYear: number;
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

type MarkerIdentity = {
  kind: "chrono-earth-place";
  placeId: string;
};

const FAR_FROM_PERIOD_ALPHA = 0.12;
const PERIOD_FADE_YEARS = 350;

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

function drawPlaces(
  Cesium: CesiumModule,
  viewer: CesiumViewer,
  previousCollection: CesiumPointCollection | null,
  places: readonly GlobePlace[],
  currentYear: number,
  selectedId?: string | null,
) {
  if (previousCollection && !viewer.isDestroyed()) {
    viewer.scene.primitives.remove(previousCollection);
  }

  const collection = viewer.scene.primitives.add(
    new Cesium.PointPrimitiveCollection(),
  );

  for (const place of places) {
    const selected = place.id === selectedId;
    const importance = place.importance ?? 2;
    const alpha = getTemporalAlpha(place, currentYear);
    const color = selected
      ? Cesium.Color.fromCssColorString("#fff2bd").withAlpha(1)
      : Cesium.Color.fromCssColorString("#e5b85c").withAlpha(alpha);

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
      pixelSize: selected ? 15 : 5 + importance * 1.5,
      show: alpha > FAR_FROM_PERIOD_ALPHA,
      color,
      outlineColor: selected
        ? Cesium.Color.fromCssColorString("#fff9df").withAlpha(0.9)
        : Cesium.Color.fromCssColorString("#8c6229").withAlpha(alpha * 0.75),
      outlineWidth: selected ? 4 : 1.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    });
  }

  viewer.scene.requestRender();
  return collection;
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

export function GlobeScene({
  places,
  currentYear,
  selectedId,
  onSelect,
}: GlobeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumViewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const pointsRef = useRef<CesiumPointCollection | null>(null);
  const placesRef = useRef(places);
  const yearRef = useRef(currentYear);
  const selectedIdRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    placesRef.current = places;
    yearRef.current = currentYear;
    selectedIdRef.current = selectedId;
    onSelectRef.current = onSelect;
  }, [places, currentYear, selectedId, onSelect]);

  useEffect(() => {
    let cancelled = false;
    let inputHandler: import("cesium").ScreenSpaceEventHandler | null = null;

    async function initialise() {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const Cesium = await import("cesium");
      if (cancelled || !containerRef.current) {
        return;
      }

      let naturalEarthLayer: import("cesium").ImageryLayer | false = false;
      try {
        const naturalEarthProvider =
          await Cesium.TileMapServiceImageryProvider.fromUrl(
            "/cesium/Assets/Textures/NaturalEarthII",
          );
        naturalEarthLayer = new Cesium.ImageryLayer(naturalEarthProvider);
        naturalEarthLayer.brightness = 0.48;
        naturalEarthLayer.contrast = 1.34;
        naturalEarthLayer.saturation = 0.58;
        naturalEarthLayer.gamma = 0.82;
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
        shouldAnimate: true,
      });

      if (cancelled) {
        viewer.destroy();
        return;
      }

      cesiumRef.current = Cesium;
      viewerRef.current = viewer;

      viewer.scene.backgroundColor =
        Cesium.Color.fromCssColorString("#02050d");
      viewer.scene.globe.baseColor =
        Cesium.Color.fromCssColorString("#071722");
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.dynamicAtmosphereLighting = true;
      viewer.scene.globe.dynamicAtmosphereLightingFromSun = true;
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.00018;
      viewer.scene.highDynamicRange = true;

      const controller = viewer.scene.screenSpaceCameraController;
      controller.enableCollisionDetection = true;
      controller.minimumZoomDistance = 1_250_000;
      controller.maximumZoomDistance = 42_000_000;
      controller.inertiaSpin = 0.9;
      controller.inertiaTranslate = 0.85;
      controller.inertiaZoom = 0.82;

      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(18, 25, 21_500_000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });

      pointsRef.current = drawPlaces(
        Cesium,
        viewer,
        null,
        placesRef.current,
        yearRef.current,
        selectedIdRef.current,
      );
      flyToPlace(
        Cesium,
        viewer,
        placesRef.current.find(
          (place) => place.id === selectedIdRef.current,
        ),
      );

      inputHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      inputHandler.setInputAction(
        (movement: { position: import("cesium").Cartesian2 }) => {
          const picked = viewer.scene.pick(movement.position) as
            | { id?: unknown; primitive?: { id?: unknown } }
            | undefined;
          const identity = picked?.id ?? picked?.primitive?.id;

          if (isMarkerIdentity(identity)) {
            onSelectRef.current(identity.placeId);
          }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK,
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
      cancelled = true;
      inputHandler?.destroy();
      inputHandler = null;
      pointsRef.current = null;
      cesiumRef.current = null;

      const viewer = viewerRef.current;
      viewerRef.current = null;
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || viewer.isDestroyed()) {
      return;
    }

    pointsRef.current = drawPlaces(
      Cesium,
      viewer,
      pointsRef.current,
      places,
      currentYear,
      selectedId,
    );
  }, [places, currentYear, selectedId]);

  useEffect(() => {
    const Cesium = cesiumRef.current;
    const viewer = viewerRef.current;
    if (!Cesium || !viewer || viewer.isDestroyed()) {
      return;
    }

    flyToPlace(
      Cesium,
      viewer,
      places.find((place) => place.id === selectedId),
    );
  }, [places, selectedId]);

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
