"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  GlobeScene,
  type GlobeRouteView,
  type PerformanceMode,
  type PerformanceTier,
} from "./components/GlobeScene";
import { AmbientSoundscape } from "./components/AmbientSoundscape";
import type { SoundCue } from "./components/AmbientSoundscape";
import GlobePerformanceControls from "./components/GlobePerformanceControls";
import {
  GlobeAccessibilityAnnouncer,
  type CameraAnnouncement,
  type ClusterAnnouncement,
} from "./components/GlobeAccessibilityAnnouncer";
import JourneyNarrator from "./components/JourneyNarrator";
import FilterResults from "./components/FilterResults";
import MediaLightbox from "./components/MediaLightbox";
import RegionNavigator from "./components/RegionNavigator";
import OfflineJourneyPacks from "./components/OfflineJourneyPacks";
import CivilizationNebula from "./components/CivilizationNebula";
import CivilizationNetwork from "./components/CivilizationNetwork";
import JourneyTransition from "./components/JourneyTransition";
import VoiceImmersion from "./components/VoiceImmersion";
import VoiceTransition from "./components/VoiceTransition";
import VoiceJourneyLibrary from "./components/VoiceJourneyLibrary";
import VoiceJourneyCeremony from "./components/VoiceJourneyCeremony";
import VoiceArchive from "./components/VoiceArchive";
import VoiceObservatory from "./components/VoiceObservatory";
import ExperienceHub, { type ExperiencePreset, type HubAction } from "./components/ExperienceHub";
import EssentialTour from "./components/EssentialTour";
import ShortcutHelp from "./components/ShortcutHelp";
import { eras, getEraForYear } from "./data/eras";
import {
  historyRoutes,
  type HistoryRouteCategory,
} from "./data/historyRoutes";
import { extendedPlaces } from "./data/extendedPlaces";
import { places as corePlaces, type Place } from "./data/places";
import { getRouteCategoryMeta, routeCategories } from "./data/routeCategories";
import { journeys } from "./data/journeys";
import { getPlaceMedia } from "./data/placeMedia";
import { getSourcesForPlace } from "./data/sourceCatalog";
import { getSourcesForEvent } from "./data/eventSources";
import { historicalVoices } from "./data/historicalVoices";
import { voiceJourneys } from "./data/voiceJourneys";
import { useModalFocus } from "./hooks/useModalFocus";

const MIN_YEAR = -3000;
const MAX_YEAR = 2026;
const PROLOGUE_DURATION = 5200;
const GLOBE_LOAD_DELAY = 600;
const places: readonly Place[] = [...corePlaces, ...extendedPlaces];
const TOTAL_EVENTS = places.reduce(
  (total, place) => total + place.events.length,
  0,
);
const PROLOGUE_YEARS = [-3000, -753, 221, 1453, 1969, 2026];
const DAILY_STAMP = new Date();
const DAILY_DAY_NUMBER = Math.floor(
  Date.UTC(
    DAILY_STAMP.getFullYear(),
    DAILY_STAMP.getMonth(),
    DAILY_STAMP.getDate(),
  ) / 86_400_000,
);
const DAILY_PLACE = places[DAILY_DAY_NUMBER % places.length];
const DAILY_EVENT =
  DAILY_PLACE.events[DAILY_DAY_NUMBER % DAILY_PLACE.events.length] ??
  DAILY_PLACE.events[0];
const DAILY_VOICE = historicalVoices[DAILY_DAY_NUMBER % historicalVoices.length];
const DAILY_DATE_LABEL = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
}).format(DAILY_STAMP);
const OPENING_PLACE_IDS = [
  "giza-pyramids",
  "stonehenge",
  "acropolis-of-athens",
  "colosseum",
  "petra",
  "hagia-sophia",
  "great-wall",
  "mogao-caves",
  "angkor-wat",
  "taj-mahal",
  "dome-of-the-rock",
  "machu-picchu",
  "chichen-itza",
  "moai-rapa-nui",
  "lalibela",
] as const;
type OpeningStage = "boot" | "focus" | "depart" | "done";
type FocusLens = "landmarks" | "routes" | "voices";
type LensTransition = {
  from: FocusLens;
  to: FocusLens;
  phase: "veil" | "reveal";
  sequence: number;
};
type TimelineDirection = "past" | "future";
type TimelineEcho = { year: number; label: string; key: number };
type ArchiveLayer = "place" | "chronicle" | "voice" | "connections";
type StoryTransition = {
  direction: -1 | 1;
  target: number;
  phase: "out" | "in";
  sequence: number;
};
const ARCHIVE_LAYERS: readonly {
  id: ArchiveLayer;
  index: string;
  label: string;
  english: string;
}[] = [
  { id: "place", index: "Ⅰ", label: "地点", english: "PLACE" },
  { id: "chronicle", index: "Ⅱ", label: "纪年", english: "CHRONICLE" },
  { id: "voice", index: "Ⅲ", label: "文本", english: "VOICE" },
  { id: "connections", index: "Ⅳ", label: "关联", english: "THREADS" },
];
const TIMELINE_MILESTONES = [
  { year: -2560, label: "吉萨金字塔群" },
  { year: -753, label: "罗马建城纪年" },
  { year: -500, label: "古典世界展开" },
  { year: 221, label: "秦完成统一" },
  { year: 500, label: "信仰之路展开" },
  { year: 800, label: "欧亚道路复兴" },
  { year: 1453, label: "君士坦丁堡易手" },
  { year: 1500, label: "海洋时代展开" },
  { year: 1605, label: "《堂吉诃德》问世" },
  { year: 1789, label: "革命时代" },
  { year: 1900, label: "互联世界展开" },
  { year: 1969, label: "人类凝望地球" },
] as const;
const FOCUS_LENSES: readonly {
  id: FocusLens;
  index: string;
  label: string;
  english: string;
  description: string;
  guide: string;
}[] = [
  { id: "landmarks", index: "01", label: "历史地标", english: "LANDMARKS", description: "保留最重要的文明坐标与少量时代回声", guide: "悬停一枚金色坐标，文明路径会从黑暗中显影；点击它，打开这片土地的历史档案。" },
  { id: "routes", index: "02", label: "文明航线", english: "ROUTES", description: "点亮当前年份仍在流动的贸易、迁徙与知识路线", guide: "跟随流动的光，观察贸易、迁徙与知识如何跨越大陆；时间轴会改变仍在发光的路线。" },
  { id: "voices", index: "03", label: "历史之声", english: "VOICES", description: "展开同时代的诗句、记忆与文明文本", guide: "让同一时代的诗句与记忆漂浮在地球周围；点击一句话，就能进入它所属的文明现场。" },
];
type RegionFilter =
  | "all"
  | "africa"
  | "europe"
  | "asia"
  | "north-america"
  | "south-america"
  | "oceania";

type ThemeFilter = "all" | "city" | "sacred" | "power" | "knowledge";

const REGIONS: readonly { id: RegionFilter; label: string }[] = [
  { id: "all", label: "全球" },
  { id: "africa", label: "非洲" },
  { id: "europe", label: "欧洲" },
  { id: "asia", label: "亚洲" },
  { id: "north-america", label: "北美" },
  { id: "south-america", label: "南美" },
  { id: "oceania", label: "大洋洲" },
];

const THEMES: readonly { id: ThemeFilter; label: string }[] = [
  { id: "all", label: "全部类型" },
  { id: "city", label: "城市与聚落" },
  { id: "sacred", label: "信仰与圣地" },
  { id: "power", label: "宫殿与权力" },
  { id: "knowledge", label: "知识与艺术" },
];

function getPlaceRegion(place: Place): Exclude<RegionFilter, "all"> {
  const [longitude, latitude] = place.coordinates;
  if (latitude < -10 && (longitude > 105 || longitude < -140)) return "oceania";
  if (longitude >= -170 && longitude <= -25 && latitude >= 12) {
    return "north-america";
  }
  if (longitude >= -92 && longitude <= -28 && latitude < 12) {
    return "south-america";
  }
  if (longitude >= -20 && longitude <= 55 && latitude < 37) return "africa";
  if (longitude >= -25 && longitude <= 60 && latitude >= 37) return "europe";
  if (longitude >= 25 && longitude <= 180) return "asia";
  return "oceania";
}

function getPlaceTheme(place: Place): Exclude<ThemeFilter, "all"> {
  const descriptor = `${place.category} ${place.name} ${place.eraLabel}`.toLowerCase();
  if (/temple|church|mosque|sacred|relig|monastery|cathedral|tomb|圣|寺|教堂|陵/.test(descriptor)) {
    return "sacred";
  }
  if (/knowledge|library|observatory|art|cave|university|书院|洞窟|艺术|学/.test(descriptor)) {
    return "knowledge";
  }
  if (/palace|castle|fort|wall|citadel|imperial|宫|城堡|长城|堡垒|王/.test(descriptor)) {
    return "power";
  }
  return "city";
}

function formatYear(year: number) {
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

function getVisibleEvent(place: Place, year: number) {
  return [...place.events]
    .sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))
    .at(0);
}

function formatCoordinate(
  value: number,
  positiveDirection: string,
  negativeDirection: string,
) {
  return `${Math.abs(value).toFixed(4)}° ${
    value >= 0 ? positiveDirection : negativeDirection
  }`;
}

export function ChronoExperience() {
  const [currentYear, setCurrentYear] = useState(1453);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [archiveLayer, setArchiveLayer] = useState<ArchiveLayer>("place");
  const [prologueVisible, setPrologueVisible] = useState(false);
  const [globeEnabled, setGlobeEnabled] = useState(true);
  const [introVisible, setIntroVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [lensPanelOpen, setLensPanelOpen] = useState(false);
  const [focusLens, setFocusLens] = useState<FocusLens>("landmarks");
  const [lensTransition, setLensTransition] = useState<LensTransition | null>(null);
  const [timelineTraveling, setTimelineTraveling] = useState(false);
  const [timelineDirection, setTimelineDirection] =
    useState<TimelineDirection>("future");
  const [timelineVelocity, setTimelineVelocity] = useState(0);
  const [timelineEcho, setTimelineEcho] = useState<TimelineEcho | null>(null);
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>("all");
  const [eraFilter, setEraFilter] = useState<string>("all");
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyTransition, setStoryTransition] =
    useState<StoryTransition | null>(null);
  const [storyExiting, setStoryExiting] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [soundCue, setSoundCue] = useState<{ cue: SoundCue; key: number }>({
    cue: null,
    key: 0,
  });
  const [playing, setPlaying] = useState(false);
  const [storyChapter, setStoryChapter] = useState(0);
  const [routeCategoryFilter, setRouteCategoryFilter] =
    useState<HistoryRouteCategory | null>(null);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [journeyChapter, setJourneyChapter] = useState(0);
  const [journeyNarrationOn, setJourneyNarrationOn] = useState(false);
  const [voiceJourneyNarrationOn, setVoiceJourneyNarrationOn] = useState(false);
  const [voiceJourneyNarrationRate, setVoiceJourneyNarrationRate] = useState(0.92);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [filterResultIndex, setFilterResultIndex] = useState(0);
  const [essentialTourOpen, setEssentialTourOpen] = useState(false);
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [mediaLightboxOpen, setMediaLightboxOpen] = useState(false);
  const [regionNavigatorOpen, setRegionNavigatorOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [offlinePacksOpen, setOfflinePacksOpen] = useState(false);
  const [civilizationNetworkOpen, setCivilizationNetworkOpen] = useState(false);
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const [voiceTransition, setVoiceTransition] = useState<{
    fromId: string;
    toId: string;
    direction: -1 | 1;
  } | null>(null);
  const [voiceJourneyLibraryOpen, setVoiceJourneyLibraryOpen] = useState(false);
  const [voiceArchiveOpen, setVoiceArchiveOpen] = useState(false);
  const [voiceObservatoryOpen, setVoiceObservatoryOpen] = useState(false);
  const [experienceHubOpen, setExperienceHubOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [textScale, setTextScale] = useState<"normal" | "large">("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [discoveredVoiceIds, setDiscoveredVoiceIds] = useState<string[]>([]);
  const [visitedPlaceIds, setVisitedPlaceIds] = useState<string[]>([]);
  const [customVoiceQueue, setCustomVoiceQueue] = useState<string[]>([]);
  const [localStateHydrated, setLocalStateHydrated] = useState(false);
  const [activeVoiceJourneyId, setActiveVoiceJourneyId] = useState<string | null>(null);
  const [voiceJourneyPlaying, setVoiceJourneyPlaying] = useState(false);
  const [voiceJourneyCeremony, setVoiceJourneyCeremony] = useState<{
    journeyId: string;
    phase: "prelude" | "finale";
  } | null>(null);
  const [performanceMode, setPerformanceMode] =
    useState<PerformanceMode>("auto");
  const [activePerformanceTier, setActivePerformanceTier] =
    useState<PerformanceTier>("balanced");
  const [runtimeFps, setRuntimeFps] = useState<number | null>(null);
  const [autoAdaptNotice, setAutoAdaptNotice] = useState(false);
  const [openingStage, setOpeningStage] = useState<OpeningStage>("boot");
  const [openingPlaceId, setOpeningPlaceId] = useState<string | null>(null);
  const [cameraAnnouncement, setCameraAnnouncement] =
    useState<CameraAnnouncement | null>(null);
  const [clusterAnnouncement, setClusterAnnouncement] =
    useState<ClusterAnnouncement | null>(null);
  const [hoveredRoute, setHoveredRoute] = useState<GlobeRouteView | null>(null);
  const [pinnedRoute, setPinnedRoute] = useState<GlobeRouteView | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [lensGuideEligible, setLensGuideEligible] = useState(false);
  const [lensGuideStep, setLensGuideStep] = useState<number | null>(null);
  const lensTransitionSequence = useRef(0);
  const timelineSampleRef = useRef({ year: currentYear, at: 0 });
  const timelineEchoKey = useRef(0);
  const timelineIdleTimer = useRef<number | null>(null);
  const storyTransitionSequence = useRef(0);
  const storyExitTimer = useRef<number | null>(null);
  const soundCueKey = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchDialogRef = useRef<HTMLElement>(null);
  const lensPanelDialogRef = useRef<HTMLElement>(null);
  const lensGuideDialogRef = useRef<HTMLElement>(null);
  const offlinePacksDialogRef = useRef<HTMLElement>(null);
  const storyDialogRef = useRef<HTMLElement>(null);
  const cameraAnnouncementKey = useRef(0);
  const clusterAnnouncementKey = useRef(0);

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedId) ?? null,
    [selectedId],
  );
  const openingPlace = useMemo(
    () => places.find(({ id }) => id === openingPlaceId) ?? null,
    [openingPlaceId],
  );
  const openingEvent = openingPlace?.events[0] ?? null;
  const openingMedia = openingPlace ? getPlaceMedia(openingPlace.id) : undefined;
  const openingActive = openingStage !== "done";
  const routePreview = hoveredRoute ?? pinnedRoute;
  const routePreviewCategory = routePreview
    ? getRouteCategoryMeta(routePreview.category)
    : undefined;
  const activeLensGuide =
    lensGuideStep === null ? null : FOCUS_LENSES[lensGuideStep];
  const lensTransitionTarget = lensTransition
    ? FOCUS_LENSES.find(({ id }) => id === lensTransition.to) ?? null
    : null;
  const hoveredLandmark = useMemo(
    () => places.find(({ id }) => id === hoveredPlaceId) ?? null,
    [hoveredPlaceId],
  );
  const hoveredLandmarkEvent = hoveredLandmark
    ? getVisibleEvent(hoveredLandmark, currentYear)
    : null;
  const hoveredLandmarkConnections = hoveredLandmark
    ? historyRoutes.filter(
        ({ from, to }) =>
          from === hoveredLandmark.id || to === hoveredLandmark.id,
      ).length
    : 0;
  const filteredPlaces = useMemo(() => {
    const era = eras.find(({ id }) => id === eraFilter);
    return places.filter((place) => {
      const regionMatches =
        regionFilter === "all" || getPlaceRegion(place) === regionFilter;
      const themeMatches =
        themeFilter === "all" || getPlaceTheme(place) === themeFilter;
      const eraMatches =
        !era ||
        (place.period[0] <= era.range[1] && place.period[1] >= era.range[0]) ||
        place.events.some(
          ({ year }) => year >= era.range[0] && year <= era.range[1],
        );
      return regionMatches && themeMatches && eraMatches;
    });
  }, [eraFilter, regionFilter, themeFilter]);
  const globePlaces = useMemo(
    () =>
      selectedPlace && !filteredPlaces.some(({ id }) => id === selectedPlace.id)
        ? [...filteredPlaces, selectedPlace]
        : filteredPlaces,
    [filteredPlaces, selectedPlace],
  );
  const globeVoices = useMemo(() => {
    const placeIndex = new Map(places.map((place) => [place.id, place]));
    return historicalVoices.flatMap((voice) => {
      const place = placeIndex.get(voice.placeId);
      return place
        ? [{
            id: voice.id,
            placeId: voice.placeId,
            text: voice.text,
            author: voice.author,
            year: voice.year,
            coordinates: place.coordinates,
          }]
        : [];
    });
  }, []);
  const selectedVoice = selectedPlace
    ? [...historicalVoices]
        .filter((voice) => voice.placeId === selectedPlace.id)
        .sort(
          (left, right) =>
            Math.abs(left.year - currentYear) - Math.abs(right.year - currentYear),
        )[0]
    : undefined;
  const selectedConnections = useMemo(() => {
    if (!selectedPlace) return [];
    return historyRoutes
      .filter(
        ({ from, to }) => from === selectedPlace.id || to === selectedPlace.id,
      )
      .map((route) => {
        const destinationId =
          route.from === selectedPlace.id ? route.to : route.from;
        return {
          route,
          destination: places.find(({ id }) => id === destinationId),
          category: getRouteCategoryMeta(route.category),
        };
      })
      .filter(({ destination }) => Boolean(destination))
      .sort((left, right) => {
        const leftActive =
          currentYear >= left.route.period[0] && currentYear <= left.route.period[1];
        const rightActive =
          currentYear >= right.route.period[0] && currentYear <= right.route.period[1];
        return Number(rightActive) - Number(leftActive);
      });
  }, [currentYear, selectedPlace]);
  const storyEvent = selectedPlace?.events[storyChapter] ?? null;
  const storyVoice = selectedPlace && storyEvent
    ? [...historicalVoices]
        .filter(({ placeId }) => placeId === selectedPlace.id)
        .sort(
          (left, right) =>
            Math.abs(left.year - storyEvent.year) -
            Math.abs(right.year - storyEvent.year),
        )[0]
    : undefined;
  const storySources = selectedPlace && storyEvent
    ? getSourcesForEvent(selectedPlace.id, storyEvent.year)
    : [];
  const activeVoice = activeVoiceId
    ? historicalVoices.find((voice) => voice.id === activeVoiceId) ?? null
    : null;
  const activeVoicePlace = activeVoice
    ? places.find((place) => place.id === activeVoice.placeId) ?? null
    : null;
  const transitionFromVoice = voiceTransition
    ? historicalVoices.find((voice) => voice.id === voiceTransition.fromId) ?? null
    : null;
  const transitionToVoice = voiceTransition
    ? historicalVoices.find((voice) => voice.id === voiceTransition.toId) ?? null
    : null;
  const transitionFromPlace = transitionFromVoice
    ? places.find((place) => place.id === transitionFromVoice.placeId) ?? null
    : null;
  const transitionToPlace = transitionToVoice
    ? places.find((place) => place.id === transitionToVoice.placeId) ?? null
    : null;
  const activeVoiceJourney = activeVoiceJourneyId
    ? voiceJourneys.find((journey) => journey.id === activeVoiceJourneyId) ?? null
    : null;
  const activeVoiceJourneyChapter = activeVoiceJourney && activeVoiceId
    ? activeVoiceJourney.voiceIds.indexOf(activeVoiceId)
    : -1;
  const ceremonyJourney = voiceJourneyCeremony
    ? voiceJourneys.find(({ id }) => id === voiceJourneyCeremony.journeyId) ?? null
    : null;
  const ceremonyVoices = ceremonyJourney
    ? ceremonyJourney.voiceIds.flatMap((voiceId) => {
        const voice = historicalVoices.find(({ id }) => id === voiceId);
        return voice ? [voice] : [];
      })
    : [];
  const voiceJourneyNarrationText = ceremonyJourney && voiceJourneyCeremony
    ? voiceJourneyCeremony.phase === "prelude"
      ? `欢迎进入诗性历史旅程，${ceremonyJourney.title}。${ceremonyJourney.description}。这条思想航线共有${ceremonyVoices.length}个章节。`
      : `你已经完成诗性历史旅程，${ceremonyJourney.title}。${ceremonyJourney.closingLine}`
    : activeVoiceJourney && activeVoice && activeVoicePlace && activeVoiceJourneyChapter >= 0
      ? `第${activeVoiceJourneyChapter + 1}章，我们来到${activeVoicePlace.name}。${activeVoice.narration}${activeVoice.author}在${activeVoice.work}中留下：${activeVoice.text}。它的意思是：${activeVoice.translation}`
      : "";
  const selectedMedia = selectedPlace
    ? getPlaceMedia(selectedPlace.id)
    : undefined;
  const selectedSources = selectedPlace
    ? getSourcesForPlace(selectedPlace.id)
    : [];
  const visibleEvent = selectedPlace
    ? getVisibleEvent(selectedPlace, currentYear)
    : null;
  const announcedEvent = useMemo(
    () =>
      selectedPlace && visibleEvent
        ? {
            key: `${selectedPlace.id}:${visibleEvent.year}:${visibleEvent.title}`,
            placeName: selectedPlace.name,
            year: visibleEvent.year,
            title: visibleEvent.title,
          }
        : null,
    [selectedPlace, visibleEvent],
  );
  const visibleEventSources =
    selectedPlace && visibleEvent
      ? getSourcesForEvent(selectedPlace.id, visibleEvent.year)
      : [];
  const visibleSources =
    visibleEventSources.length > 0 ? visibleEventSources : selectedSources;
  const safeFilterResultIndex = filteredPlaces.length
    ? Math.min(filterResultIndex, filteredPlaces.length - 1)
    : 0;
  const currentEra = getEraForYear(currentYear) ?? eras[0];
  const quickSearchResults = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("zh-CN");
    const rankedPlaces = query
      ? places.filter((place) =>
          [place.name, place.localName, place.country, place.eraLabel].some(
            (value) => value.toLocaleLowerCase("zh-CN").includes(query),
          ),
        )
      : [...places].sort(
          (left, right) =>
            (right.importance ?? 0) - (left.importance ?? 0),
        );

    return rankedPlaces.slice(0, 6);
  }, [searchQuery]);
  const timelineProgress =
    ((currentYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
  const timelineIntensity = Math.min(1, timelineVelocity / 2600);
  const activeRoutes = useMemo(
    () =>
      historyRoutes.filter(
        ({ period: [startYear, endYear] }) =>
          currentYear >= startYear && currentYear <= endYear,
      ),
    [currentYear],
  );
  const visibleRoutes = routeCategoryFilter
    ? activeRoutes.filter(({ category }) => category === routeCategoryFilter)
    : activeRoutes;
  const activeJourney =
    journeys.find(({ id }) => id === activeJourneyId) ?? null;
  const activeJourneyChapter = activeJourney?.chapters[journeyChapter] ?? null;
  const archiveReadout = selectedPlace
    ? `LAT ${formatCoordinate(selectedPlace.coordinates[1], "N", "S")} · LNG ${formatCoordinate(selectedPlace.coordinates[0], "E", "W")} · ARCHIVE ${String(places.findIndex((place) => place.id === selectedPlace.id) + 1).padStart(2, "0")}`
    : `GLOBAL ARCHIVE · ${currentEra.englishLabel.toUpperCase()} · ${activeRoutes.length} ACTIVE THREADS`;

  const finishOpening = useCallback(() => {
    setOpeningStage((stage) => (stage === "done" ? "done" : "depart"));
  }, []);

  const finishLensGuide = useCallback(() => {
    setLensGuideStep(null);
    setLensGuideEligible(false);
    try {
      window.localStorage.setItem("chrono-earth:lens-guide-v1", "1");
    } catch {
      // The guide can still be dismissed when local storage is unavailable.
    }
  }, []);

  const triggerSoundCue = useCallback((cue: Exclude<SoundCue, null>) => {
    soundCueKey.current += 1;
    setSoundCue({ cue, key: soundCueKey.current });
  }, []);

  const requestFocusLens = useCallback(
    (nextLens: FocusLens) => {
      if (nextLens === focusLens) return;
      setHoveredRoute(null);
      setHoveredPlaceId(null);
      if (nextLens !== "routes") setPinnedRoute(null);
      if (reducedMotion) {
        setFocusLens(nextLens);
        setLensTransition(null);
        return;
      }
      lensTransitionSequence.current += 1;
      setLensTransition({
        from: focusLens,
        to: nextLens,
        phase: "veil",
        sequence: lensTransitionSequence.current,
      });
      triggerSoundCue("lens");
    },
    [focusLens, reducedMotion, triggerSoundCue],
  );

  const beginTimelineTravel = useCallback(() => {
    if (timelineIdleTimer.current !== null) {
      window.clearTimeout(timelineIdleTimer.current);
      timelineIdleTimer.current = null;
    }
    timelineSampleRef.current = { year: currentYear, at: performance.now() };
    setTimelineTraveling(true);
  }, [currentYear]);

  const finishTimelineTravel = useCallback(() => {
    if (timelineIdleTimer.current !== null) {
      window.clearTimeout(timelineIdleTimer.current);
      timelineIdleTimer.current = null;
    }
    setTimelineTraveling(false);
    setTimelineVelocity(0);
  }, []);

  const travelToYear = useCallback(
    (nextYear: number) => {
      const now = performance.now();
      const previous = timelineSampleRef.current;
      const delta = nextYear - previous.year;
      const elapsed = Math.max(16, now - previous.at);
      if (delta !== 0) {
        setTimelineDirection(delta < 0 ? "past" : "future");
        setTimelineVelocity(Math.round((Math.abs(delta) / elapsed) * 1000));
        const crossed = [...TIMELINE_MILESTONES]
          .filter(({ year }) =>
            delta > 0
              ? year > previous.year && year <= nextYear
              : year < previous.year && year >= nextYear,
          )
          .sort((left, right) =>
            delta > 0 ? right.year - left.year : left.year - right.year,
          )[0];
        if (crossed) {
          timelineEchoKey.current += 1;
      setTimelineEcho({ ...crossed, key: timelineEchoKey.current });
          triggerSoundCue("time");
        }
      }
      timelineSampleRef.current = { year: nextYear, at: now };
      setPlaying(false);
      setCurrentYear(nextYear);
      setTimelineTraveling(true);
      if (timelineIdleTimer.current !== null) {
        window.clearTimeout(timelineIdleTimer.current);
      }
      timelineIdleTimer.current = window.setTimeout(finishTimelineTravel, 520);
    },
    [finishTimelineTravel, triggerSoundCue],
  );

  useEffect(
    () => () => {
      if (timelineIdleTimer.current !== null) {
        window.clearTimeout(timelineIdleTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasSharedDestination = ["year", "place", "journey", "voiceJourney", "voice"]
      .some((key) => params.has(key));
    if (hasSharedDestination || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const skipTimer = window.setTimeout(() => setOpeningStage("done"), 0);
      return () => window.clearTimeout(skipTimer);
    }

    const openingPool = OPENING_PLACE_IDS.filter((id) =>
      places.some((place) => place.id === id),
    );
    let previousId: string | null = null;
    let alreadySeen = false;
    try {
      previousId = window.sessionStorage.getItem("chrono-earth:last-opening-place");
      alreadySeen = window.sessionStorage.getItem("chrono-earth:opening-seen") === "1";
    } catch { /* private browsing may block session storage */ }
    const candidates = openingPool.filter((id) => id !== previousId);
    const randomSource = new Uint32Array(1);
    window.crypto.getRandomValues(randomSource);
    const nextId = (candidates.length > 0 ? candidates : openingPool)[
      randomSource[0] % Math.max(1, candidates.length || openingPool.length)
    ];
    const place = places.find(({ id }) => id === nextId);
    if (!place) {
      const skipTimer = window.setTimeout(() => setOpeningStage("done"), 0);
      return () => window.clearTimeout(skipTimer);
    }

    try { window.sessionStorage.setItem("chrono-earth:last-opening-place", place.id); } catch { /* optional */ }

    const setupTimer = window.setTimeout(() => {
      setSelectedId(null);
      setOpeningPlaceId(place.id);
      setCurrentYear(place.events[0]?.year ?? place.period[0]);
    }, 0);
    const focusTimer = window.setTimeout(() => setOpeningStage("focus"), 80);
    const departTimer = window.setTimeout(
      () => setOpeningStage("depart"),
      alreadySeen ? 2100 : 3200,
    );
    return () => {
      window.clearTimeout(setupTimer);
      window.clearTimeout(focusTimer);
      window.clearTimeout(departTimer);
    };
  }, []);

  useEffect(() => {
    if (openingStage !== "depart") return;
    try { window.sessionStorage.setItem("chrono-earth:opening-seen", "1"); } catch { /* optional */ }
    const timer = window.setTimeout(() => setOpeningStage("done"), 2900);
    return () => window.clearTimeout(timer);
  }, [openingStage]);

  useEffect(() => {
    if (!reducedMotion || openingStage === "done") return;
    const timer = window.setTimeout(() => setOpeningStage("done"), 0);
    return () => window.clearTimeout(timer);
  }, [openingStage, reducedMotion]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("chrono-earth:favorites");
        const parsed = stored ? JSON.parse(stored) : [];
        if (Array.isArray(parsed)) {
          setFavoriteIds(
            parsed.filter(
              (id): id is string =>
                typeof id === "string" && places.some((place) => place.id === id),
            ),
          );
        }
        const storedPerformanceMode = window.localStorage.getItem(
          "chrono-earth:performance-mode",
        );
        if (
          storedPerformanceMode === "auto" ||
          storedPerformanceMode === "high" ||
          storedPerformanceMode === "balanced" ||
          storedPerformanceMode === "low"
        ) {
          setPerformanceMode(storedPerformanceMode);
        }
        const storedPreferences = JSON.parse(window.localStorage.getItem("chrono-earth:experience-preferences") ?? "{}");
        const hasMinimalModeDefault = storedPreferences.visualModeVersion === "minimal-v1";
        setFocusMode(hasMinimalModeDefault ? Boolean(storedPreferences.focusMode) : true);
        setTextScale(storedPreferences.textScale === "large" ? "large" : "normal");
        setHighContrast(Boolean(storedPreferences.highContrast));
        setReducedMotion(Boolean(storedPreferences.reducedMotion));
        const storedProgress = JSON.parse(window.localStorage.getItem("chrono-earth:progress") ?? "{}");
        if (Array.isArray(storedProgress.voices)) setDiscoveredVoiceIds(storedProgress.voices);
        if (Array.isArray(storedProgress.places)) setVisitedPlaceIds(storedProgress.places);
        setLensGuideEligible(
          window.localStorage.getItem("chrono-earth:lens-guide-v1") !== "1",
        );
      } catch {
        // A blocked or malformed local archive should not prevent exploration.
      }

      const params = new URLSearchParams(window.location.search);
      const sharedYear = Number(params.get("year"));
      if (params.has("year") && Number.isFinite(sharedYear)) {
        setCurrentYear(Math.max(MIN_YEAR, Math.min(MAX_YEAR, sharedYear)));
      }
      const sharedPlace = params.get("place");
      if (sharedPlace && places.some(({ id }) => id === sharedPlace)) {
        setSelectedId(sharedPlace);
        setIntroVisible(false);
      }
      const sharedJourney = params.get("journey");
      const journey = journeys.find(({ id }) => id === sharedJourney);
      if (journey?.chapters[0]) {
        setActiveJourneyId(journey.id);
        setJourneyChapter(0);
        setRouteCategoryFilter(journey.routeCategory);
        setSelectedId(journey.chapters[0].placeId);
        setCurrentYear(journey.chapters[0].year);
        setIntroVisible(false);
      }
      const sharedVoiceJourney = params.get("voiceJourney");
      const voiceJourney = voiceJourneys.find(({ id }) => id === sharedVoiceJourney);
      const firstVoice = historicalVoices.find(
        ({ id }) => id === voiceJourney?.voiceIds[0],
      );
      if (voiceJourney && firstVoice) {
        setActiveVoiceJourneyId(voiceJourney.id);
        setVoiceJourneyPlaying(false);
        setActiveVoiceId(firstVoice.id);
        setSelectedId(firstVoice.placeId);
        setCurrentYear(firstVoice.year);
        setVoiceJourneyCeremony({ journeyId: voiceJourney.id, phase: "prelude" });
        setIntroVisible(false);
      }
      const sharedVoice = params.get("voice");
      const voice = historicalVoices.find(({ id }) => id === sharedVoice);
      if (voice) {
        setActiveVoiceId(voice.id); setSelectedId(voice.placeId); setCurrentYear(voice.year); setIntroVisible(false);
      }
      setLocalStateHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (
      !localStateHydrated ||
      !lensGuideEligible ||
      openingActive ||
      selectedId ||
      storyOpen
    ) return;
    const timer = window.setTimeout(() => setLensGuideStep(0), 900);
    return () => window.clearTimeout(timer);
  }, [lensGuideEligible, localStateHydrated, openingActive, selectedId, storyOpen]);

  useEffect(() => {
    if (!activeLensGuide) return;
    const timer = window.setTimeout(() => {
      setFocusMode(true);
      requestFocusLens(activeLensGuide.id);
      setLensPanelOpen(false);
      setSearchOpen(false);
      setFilterOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeLensGuide, requestFocusLens]);

  useEffect(() => {
    const activeSequence = lensTransition?.sequence;
    const targetLens = lensTransition?.to;
    if (activeSequence === undefined || targetLens === undefined) return;
    const revealTimer = window.setTimeout(() => {
      setFocusLens(targetLens);
      setLensTransition((transition) =>
        transition?.sequence === activeSequence
          ? { ...transition, phase: "reveal" }
          : transition,
      );
    }, 260);
    const finishTimer = window.setTimeout(() => {
      setLensTransition((transition) =>
        transition?.sequence === activeSequence ? null : transition,
      );
    }, 920);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
    };
  }, [lensTransition?.sequence, lensTransition?.to]);

  useEffect(() => {
    if (lensGuideStep === null) return;
    const handleGuideKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishLensGuide();
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLensGuideStep((step) => Math.max(0, (step ?? 0) - 1));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (lensGuideStep >= FOCUS_LENSES.length - 1) finishLensGuide();
        else setLensGuideStep(lensGuideStep + 1);
      }
    };
    window.addEventListener("keydown", handleGuideKeys);
    return () => window.removeEventListener("keydown", handleGuideKeys);
  }, [finishLensGuide, lensGuideStep]);

  useEffect(() => {
    if (lensGuideStep === null || !selectedId) return;
    const timer = window.setTimeout(finishLensGuide, 0);
    return () => window.clearTimeout(timer);
  }, [finishLensGuide, lensGuideStep, selectedId]);

  useEffect(() => {
    const handleCommand = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setExperienceHubOpen((value) => !value);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if (key === "?") setShortcutHelpOpen((value) => !value);
      if (key === "g") { setSelectedId(null); setActiveVoiceId(null); setStoryOpen(false); setIntroVisible(false); }
      if (key === "v") setVoiceArchiveOpen(true);
      if (key === "j") setVoiceJourneyLibraryOpen(true);
      if (key === "o") setVoiceObservatoryOpen(true);
      if (key === "f") setFocusMode((value) => !value);
    };
    window.addEventListener("keydown", handleCommand);
    return () => window.removeEventListener("keydown", handleCommand);
  }, []);

  useEffect(() => {
    if (!localStateHydrated) return;
    const timer = window.setTimeout(() => {
      if (activeVoiceId) setDiscoveredVoiceIds((items) => items.includes(activeVoiceId) ? items : [...items, activeVoiceId]);
      if (selectedId) setVisitedPlaceIds((items) => items.includes(selectedId) ? items : [...items, selectedId]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeVoiceId, localStateHydrated, selectedId]);

  useEffect(() => {
    if (!localStateHydrated) return;
    window.localStorage.setItem("chrono-earth:progress", JSON.stringify({ voices: discoveredVoiceIds, places: visitedPlaceIds }));
  }, [discoveredVoiceIds, localStateHydrated, visitedPlaceIds]);

  useEffect(() => {
    if (!localStateHydrated) return;
    window.localStorage.setItem("chrono-earth:experience-preferences", JSON.stringify({ visualModeVersion: "minimal-v1", focusMode, textScale, highContrast, reducedMotion }));
  }, [focusMode, highContrast, localStateHydrated, reducedMotion, textScale]);

  useEffect(() => {
    if (!localStateHydrated || openingActive) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem("chrono-earth:last-session", JSON.stringify({ year: currentYear, placeId: selectedId }));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [currentYear, localStateHydrated, openingActive, selectedId]);

  useEffect(() => {
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : PROLOGUE_DURATION;
    const timer = window.setTimeout(
      () => setPrologueVisible(false),
      duration,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => setGlobeEnabled(true),
      reducedMotion ? 0 : GLOBE_LOAD_DELAY,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setCurrentYear((year) => {
        const next = year + 14;
        return next > MAX_YEAR ? MIN_YEAR : next;
      });
    }, 140);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!reducedMotion) return;
    const timer = window.setTimeout(() => setPlaying(false), 0);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const selectPlace = useCallback((id: string) => {
    setIntroVisible(false);
    setSelectedId(id);
    setArchiveLayer("place");
    setStoryOpen(false);
    setMediaLightboxOpen(false);
    const place = places.find((candidate) => candidate.id === id);
    if (place) {
      setCurrentYear((year) => getVisibleEvent(place, year)?.year ?? year);
    }
  }, []);

  const openVoiceImmersion = useCallback(
    (placeId: string, voiceId: string) => {
      const voice = historicalVoices.find((candidate) => candidate.id === voiceId);
      if (!voice) return;
      setIntroVisible(false);
      setPlaying(false);
      setStoryOpen(false);
      setActiveJourneyId(null);
      setActiveVoiceId(voice.id);
      setVoiceTransition(null);
      setActiveVoiceJourneyId(null);
      setVoiceJourneyPlaying(false);
      setVoiceJourneyCeremony(null);
      setSelectedId(placeId);
      setCurrentYear(voice.year);
      setSoundOn(true);
    },
    [],
  );

  const navigateVoice = useCallback((direction: -1 | 1) => {
    if (!activeVoiceId || voiceTransition) return;
    const sequence = activeVoiceJourney?.voiceIds ?? (customVoiceQueue.length > 0 ? customVoiceQueue : historicalVoices.map(({ id }) => id));
    const currentIndex = sequence.indexOf(activeVoiceId);
    const nextIndex =
      (Math.max(currentIndex, 0) + direction + sequence.length) % sequence.length;
    const nextVoice = historicalVoices.find(({ id }) => id === sequence[nextIndex]);
    if (!nextVoice) return;
    setVoiceTransition({
      fromId: activeVoiceId,
      toId: nextVoice.id,
      direction,
    });
  }, [activeVoiceId, activeVoiceJourney, customVoiceQueue, voiceTransition]);

  const reachVoiceTransitionMidpoint = useCallback(() => {
    const nextVoice = historicalVoices.find(
      (voice) => voice.id === voiceTransition?.toId,
    );
    if (!nextVoice) return;
    setActiveVoiceId(nextVoice.id);
    setSelectedId(nextVoice.placeId);
    setCurrentYear(nextVoice.year);
  }, [voiceTransition?.toId]);

  const closeVoiceImmersion = useCallback(() => {
    setVoiceTransition(null);
    setActiveVoiceId(null);
    setActiveVoiceJourneyId(null);
    setVoiceJourneyPlaying(false);
    setVoiceJourneyCeremony(null);
  }, []);

  const completeVoiceTransition = useCallback(() => {
    setVoiceTransition(null);
  }, []);

  const startVoiceJourney = useCallback((journeyId: string) => {
    const journey = voiceJourneys.find(({ id }) => id === journeyId);
    const firstVoice = historicalVoices.find(({ id }) => id === journey?.voiceIds[0]);
    if (!journey || !firstVoice) return;
    setVoiceJourneyLibraryOpen(false);
    setIntroVisible(false);
    setPlaying(false);
    setStoryOpen(false);
    setActiveJourneyId(null);
    setActiveVoiceJourneyId(journey.id);
    setVoiceJourneyPlaying(false);
    setVoiceTransition(null);
    setActiveVoiceId(firstVoice.id);
    setSelectedId(firstVoice.placeId);
    setCurrentYear(firstVoice.year);
    setSoundOn(true);
    setVoiceJourneyCeremony({ journeyId: journey.id, phase: "prelude" });
  }, []);

  const beginVoiceJourney = useCallback(() => {
    setVoiceJourneyCeremony(null);
    setVoiceJourneyPlaying(true);
  }, []);

  const replayVoiceJourney = useCallback(() => {
    const journey = voiceJourneys.find(
      ({ id }) => id === voiceJourneyCeremony?.journeyId,
    );
    const firstVoice = historicalVoices.find(({ id }) => id === journey?.voiceIds[0]);
    if (!journey || !firstVoice) return;
    setVoiceJourneyCeremony({ journeyId: journey.id, phase: "prelude" });
    setVoiceJourneyPlaying(false);
    setVoiceTransition(null);
    setActiveVoiceJourneyId(journey.id);
    setActiveVoiceId(firstVoice.id);
    setSelectedId(firstVoice.placeId);
    setCurrentYear(firstVoice.year);
  }, [voiceJourneyCeremony?.journeyId]);

  const cycleVoiceNarrationRate = useCallback(() => {
    setVoiceJourneyNarrationRate((rate) =>
      rate < 1 ? 1 : rate < 1.15 ? 1.15 : 0.92,
    );
  }, []);

  const advanceVoiceJourney = useCallback(() => {
    if (
      !voiceJourneyPlaying ||
      !activeVoiceJourney ||
      !activeVoiceId ||
      voiceTransition ||
      voiceJourneyCeremony
    ) return;
    const chapterIndex = activeVoiceJourney.voiceIds.indexOf(activeVoiceId);
    if (chapterIndex < 0) return;
    const isFinalChapter = chapterIndex === activeVoiceJourney.voiceIds.length - 1;
    if (isFinalChapter) {
      setVoiceJourneyPlaying(false);
      setVoiceJourneyCeremony({
        journeyId: activeVoiceJourney.id,
        phase: "finale",
      });
    } else {
      navigateVoice(1);
    }
  }, [
    activeVoiceId,
    activeVoiceJourney,
    navigateVoice,
    voiceJourneyCeremony,
    voiceJourneyPlaying,
    voiceTransition,
  ]);

  useEffect(() => {
    if (
      !voiceJourneyPlaying ||
      !activeVoiceJourney ||
      !activeVoiceId ||
      voiceTransition
    ) return;
    const chapterIndex = activeVoiceJourney.voiceIds.indexOf(activeVoiceId);
    if (chapterIndex < 0) return;
    const isFinalChapter = chapterIndex === activeVoiceJourney.voiceIds.length - 1;
    const timer = window.setTimeout(
      advanceVoiceJourney,
      voiceJourneyNarrationOn ? 16_000 : isFinalChapter ? 7800 : 6500,
    );
    return () => window.clearTimeout(timer);
  }, [
    activeVoiceId,
    activeVoiceJourney,
    advanceVoiceJourney,
    voiceJourneyPlaying,
    voiceJourneyNarrationOn,
    voiceTransition,
  ]);

  const randomExplore = () => {
    setActiveJourneyId(null);
    const candidates = places.filter((place) => place.id !== selectedId);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    if (next) {
      selectPlace(next.id);
      setCurrentYear(next.events[0]?.year ?? currentYear);
    }
  };

  const moveFilterResult = (nextIndex: number) => {
    if (!filteredPlaces.length) return;
    const next = Math.max(0, Math.min(nextIndex, filteredPlaces.length - 1));
    setFilterResultIndex(next);
    selectPlace(filteredPlaces[next].id);
  };

  const startJourney = (journeyId: string) => {
    const journey = journeys.find(({ id }) => id === journeyId);
    const chapter = journey?.chapters[0];
    if (!journey || !chapter) return;
    setIntroVisible(false);
    setStoryOpen(false);
    setPlaying(false);
    setActiveJourneyId(journey.id);
    setJourneyChapter(0);
    setRouteCategoryFilter(journey.routeCategory);
    setCurrentYear(chapter.year);
    setSelectedId(chapter.placeId);
  };

  const moveJourney = (nextIndex: number) => {
    if (!activeJourney) return;
    const next = Math.max(
      0,
      Math.min(nextIndex, activeJourney.chapters.length - 1),
    );
    const chapter = activeJourney.chapters[next];
    setJourneyChapter(next);
    setCurrentYear(chapter.year);
    setSelectedId(chapter.placeId);
  };

  const exitJourney = () => {
    setActiveJourneyId(null);
    setSelectedId(null);
    setRouteCategoryFilter(null);
  };

  const toggleFavorite = (placeId: string) => {
    setFavoriteIds((current) => {
      const next = current.includes(placeId)
        ? current.filter((id) => id !== placeId)
        : [...current, placeId];
      try {
        window.localStorage.setItem(
          "chrono-earth:favorites",
          JSON.stringify(next),
        );
      } catch {
        // Keep the in-memory collection usable when storage is unavailable.
      }
      return next;
    });
  };

  const shareCurrentView = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("year", String(currentYear));
    if (selectedPlace) url.searchParams.set("place", selectedPlace.id);
    if (activeJourney) url.searchParams.set("journey", activeJourney.id);
    if (activeVoiceId) url.searchParams.set("voice", activeVoiceId);
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    }
  };

  const openStory = () => {
    if (!selectedPlace) return;
    setStoryChapter(0);
    setCurrentYear(selectedPlace.events[0]?.year ?? currentYear);
    setStoryOpen(true);
    setStoryExiting(false);
    setStoryTransition(null);
    setPlaying(false);
    triggerSoundCue("chapter");
  };

  const exitStory = useCallback(() => {
    if (!storyOpen || storyExiting) return;
    if (reducedMotion) {
      setStoryOpen(false);
      setStoryExiting(false);
      return;
    }
    setStoryExiting(true);
    triggerSoundCue("return");
    storyExitTimer.current = window.setTimeout(() => {
      setStoryOpen(false);
      setStoryExiting(false);
      storyExitTimer.current = null;
    }, 920);
  }, [reducedMotion, storyExiting, storyOpen, triggerSoundCue]);

  useModalFocus(
    offlinePacksDialogRef,
    () => setOfflinePacksOpen(false),
    offlinePacksOpen,
  );
  useModalFocus(storyDialogRef, exitStory, storyOpen);
  useModalFocus(
    lensGuideDialogRef,
    finishLensGuide,
    lensGuideStep !== null && Boolean(activeLensGuide) && !openingActive,
  );
  useModalFocus(
    lensPanelDialogRef,
    () => setLensPanelOpen(false),
    focusMode && lensPanelOpen && !openingActive && !selectedPlace,
  );
  useModalFocus(searchDialogRef, () => setSearchOpen(false), searchOpen);

  const moveStoryChapter = useCallback(
    (target: number) => {
      if (!selectedPlace || storyTransition) return;
      const boundedTarget = Math.max(
        0,
        Math.min(target, selectedPlace.events.length - 1),
      );
      if (boundedTarget === storyChapter) return;
      const direction: -1 | 1 = boundedTarget < storyChapter ? -1 : 1;
      if (reducedMotion) {
        setStoryChapter(boundedTarget);
        setCurrentYear(selectedPlace.events[boundedTarget]?.year ?? currentYear);
        return;
      }
      storyTransitionSequence.current += 1;
      setStoryTransition({
        direction,
        target: boundedTarget,
        phase: "out",
        sequence: storyTransitionSequence.current,
      });
      triggerSoundCue("chapter");
    },
    [currentYear, reducedMotion, selectedPlace, storyChapter, storyTransition, triggerSoundCue],
  );

  useEffect(() => {
    if (!storyTransition) return;
    const sequence = storyTransition.sequence;
    if (storyTransition.phase !== "out") {
      const finishTimer = window.setTimeout(() => {
        setStoryTransition((transition) =>
          transition?.sequence === sequence ? null : transition,
        );
      }, 560);
      return () => window.clearTimeout(finishTimer);
    }
    const swapTimer = window.setTimeout(() => {
      const target = storyTransition.target;
      setStoryChapter(target);
      if (selectedPlace) {
        setCurrentYear(selectedPlace.events[target]?.year ?? currentYear);
      }
      setStoryTransition((transition) =>
        transition?.sequence === sequence
          ? { ...transition, phase: "in" }
          : transition,
      );
    }, 300);
    return () => window.clearTimeout(swapTimer);
  }, [currentYear, selectedPlace, storyTransition]);

  useEffect(() => {
    if (!storyOpen) return;
    const handleStoryKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveStoryChapter(storyChapter - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (selectedPlace && storyChapter === selectedPlace.events.length - 1) {
          exitStory();
        } else {
          moveStoryChapter(storyChapter + 1);
        }
      }
    };
    window.addEventListener("keydown", handleStoryKeys);
    return () => window.removeEventListener("keydown", handleStoryKeys);
  }, [exitStory, moveStoryChapter, selectedPlace, storyChapter, storyOpen]);

  useEffect(
    () => () => {
      if (storyExitTimer.current !== null) {
        window.clearTimeout(storyExitTimer.current);
      }
    },
    [],
  );

  const startExploring = () => {
    setIntroVisible(false);
  };

  const openDailyArchive = () => {
    setActiveJourneyId(null);
    selectPlace(DAILY_PLACE.id);
    setCurrentYear(DAILY_EVENT?.year ?? DAILY_PLACE.period[0]);
  };

  const nextChapter = () => {
    if (!selectedPlace) return;
    const next = Math.min(storyChapter + 1, selectedPlace.events.length - 1);
    moveStoryChapter(next);
  };

  const previousChapter = () => {
    if (!selectedPlace) return;
    const previous = Math.max(0, storyChapter - 1);
    moveStoryChapter(previous);
  };

  const closeUtilityPanels = () => {
    setSearchOpen(false); setFilterOpen(false); setFavoritesOpen(false); setResultsOpen(false);
    setRegionNavigatorOpen(false); setPerformanceOpen(false); setOfflinePacksOpen(false);
    setLensPanelOpen(false);
  };

  const toggleQuickSearch = () => {
    const shouldOpen = !searchOpen;
    closeUtilityPanels();
    setSearchOpen(shouldOpen);
  };

  const toggleQuickFilter = () => {
    const shouldOpen = !filterOpen;
    closeUtilityPanels();
    setFilterOpen(shouldOpen);
  };

  const toggleFocusLens = () => {
    const shouldOpen = !lensPanelOpen;
    closeUtilityPanels();
    setLensPanelOpen(shouldOpen);
  };

  const handleHubAction = (action: HubAction) => {
    setExperienceHubOpen(false);
    closeUtilityPanels();
    if (action === "tour") setEssentialTourOpen(true);
    if (action === "observatory") setVoiceObservatoryOpen(true);
    if (action === "archive") setVoiceArchiveOpen(true);
    if (action === "journeys") setVoiceJourneyLibraryOpen(true);
    if (action === "regions") setRegionNavigatorOpen(true);
    if (action === "network") setCivilizationNetworkOpen(true);
    if (action === "favorites") setFavoritesOpen(true);
    if (action === "filters") setFilterOpen(true);
    if (action === "quality") setPerformanceOpen(true);
    if (action === "offline") setOfflinePacksOpen(true);
    if (action === "random") randomExplore();
  };

  const applyExperiencePreset = (preset: ExperiencePreset) => {
    setExperienceHubOpen(false); setSelectedId(null); setActiveVoiceId(null); setIntroVisible(false);
    setRegionFilter("all"); setThemeFilter("all"); setEraFilter("all");
    setCurrentYear(preset === "origins" ? -500 : preset === "silk-road" ? 1000 : 1850);
  };

  const playCustomQueue = (voiceIds: readonly string[]) => {
    const first = historicalVoices.find(({ id }) => id === voiceIds[0]);
    if (!first) return;
    setCustomVoiceQueue([...voiceIds]); setExperienceHubOpen(false);
    openVoiceImmersion(first.placeId, first.id);
  };

  return (
    <main
      className={`experience-shell era-${currentEra.id}${
        prologueVisible ? " is-prologue" : ""
      }${focusMode ? ` is-focus-mode is-lens-${focusLens}` : ""}${openingActive ? ` is-opening-${openingStage}` : ""}${activeLensGuide ? " is-lens-guide" : ""}${lensTransition ? ` is-lens-transition is-lens-transition-${lensTransition.phase} from-${lensTransition.from} to-${lensTransition.to}` : ""}${timelineTraveling ? ` is-time-traveling is-traveling-${timelineDirection}` : ""}${textScale === "large" ? " is-large-text" : ""}${highContrast ? " is-high-contrast" : ""}${reducedMotion ? " is-reduced-motion" : ""}`}
      style={
        {
          "--era-accent": currentEra.accent,
          "--era-glow": currentEra.glow,
          "--timeline-intensity": timelineIntensity,
        } as CSSProperties
      }
    >
      <a className="skip-link" href="#place-panel">
        跳到景点信息
      </a>
      <AmbientSoundscape
        enabled={soundOn}
        eraId={currentEra.id}
        lens={focusLens}
        storyActive={storyOpen}
        traveling={timelineTraveling}
        cue={soundCue.cue}
        cueKey={soundCue.key}
      />
      <JourneyNarrator
        enabled={journeyNarrationOn && Boolean(activeJourneyChapter)}
        text={
          activeJourneyChapter
            ? `${activeJourneyChapter.title}。${activeJourneyChapter.narration}`
            : ""
        }
      />
      <JourneyNarrator
        enabled={
          voiceJourneyNarrationOn &&
          Boolean(activeVoiceJourney) &&
          !voiceTransition
        }
        text={voiceJourneyNarrationText}
        rate={voiceJourneyNarrationRate}
        onEnd={advanceVoiceJourney}
      />
      {mediaLightboxOpen && selectedMedia && selectedPlace && (
        <MediaLightbox
          media={selectedMedia}
          placeName={selectedPlace.name}
          onClose={() => setMediaLightboxOpen(false)}
        />
      )}
      {activeVoice && activeVoicePlace && (
        <VoiceImmersion
          voice={activeVoice}
          placeName={activeVoicePlace.name}
          soundOn={soundOn}
          journey={
            activeVoiceJourney && activeVoiceJourneyChapter >= 0
              ? {
                  title: activeVoiceJourney.title,
                  chapter: activeVoiceJourneyChapter + 1,
                  total: activeVoiceJourney.voiceIds.length,
                  playing: voiceJourneyPlaying,
                }
              : null
          }
          onToggleSound={() => setSoundOn((value) => !value)}
          narrationText={voiceJourneyNarrationText}
          narrationOn={voiceJourneyNarrationOn}
          narrationRate={voiceJourneyNarrationRate}
          onToggleNarration={() => setVoiceJourneyNarrationOn((value) => !value)}
          onCycleNarrationRate={cycleVoiceNarrationRate}
          onToggleJourneyPlay={() => setVoiceJourneyPlaying((value) => !value)}
          onOpenJourneys={() => setVoiceJourneyLibraryOpen(true)}
          onOpenArchive={() => setVoiceArchiveOpen(true)}
          onNavigate={navigateVoice}
          onClose={closeVoiceImmersion}
          onExplore={closeVoiceImmersion}
        />
      )}
      {voiceTransition &&
        transitionFromVoice &&
        transitionToVoice &&
        transitionFromPlace &&
        transitionToPlace && (
          <VoiceTransition
            key={`${voiceTransition.fromId}:${voiceTransition.toId}`}
            from={transitionFromVoice}
            to={transitionToVoice}
            fromPlace={transitionFromPlace.name}
            toPlace={transitionToPlace.name}
            direction={voiceTransition.direction}
            onMidpoint={reachVoiceTransitionMidpoint}
            onComplete={completeVoiceTransition}
          />
        )}
      {voiceJourneyLibraryOpen && (
        <VoiceJourneyLibrary
          onStart={startVoiceJourney}
          onClose={() => setVoiceJourneyLibraryOpen(false)}
        />
      )}
      {voiceArchiveOpen && (
        <VoiceArchive
          places={places}
          onSelect={(placeId, voiceId) => {
            setVoiceArchiveOpen(false);
            openVoiceImmersion(placeId, voiceId);
          }}
          onClose={() => setVoiceArchiveOpen(false)}
        />
      )}
      {voiceObservatoryOpen && (
        <VoiceObservatory
          places={places}
          onSelect={(placeId, voiceId) => {
            setVoiceObservatoryOpen(false);
            openVoiceImmersion(placeId, voiceId);
          }}
          onClose={() => setVoiceObservatoryOpen(false)}
        />
      )}
      {experienceHubOpen && (
        <ExperienceHub
          places={places}
          voices={historicalVoices}
          discoveredVoices={discoveredVoiceIds}
          visitedPlaces={visitedPlaceIds}
          currentYear={currentYear}
          currentPlaceName={selectedPlace?.name}
          focusMode={focusMode}
          textScale={textScale}
          highContrast={highContrast}
          reducedMotion={reducedMotion}
          onAction={handleHubAction}
          onSelectPlace={(placeId) => { setExperienceHubOpen(false); selectPlace(placeId); }}
          onSelectVoice={(placeId, voiceId) => { setExperienceHubOpen(false); openVoiceImmersion(placeId, voiceId); }}
          onPlayQueue={playCustomQueue}
          onPreset={applyExperiencePreset}
          onToggleFocus={() => setFocusMode((value) => !value)}
          onTextScale={setTextScale}
          onHighContrast={setHighContrast}
          onReducedMotion={setReducedMotion}
          onShare={shareCurrentView}
          onClose={() => setExperienceHubOpen(false)}
        />
      )}
      {essentialTourOpen && (
        <EssentialTour
          places={places}
          onEnter={(placeId, voiceId) => { setEssentialTourOpen(false); openVoiceImmersion(placeId, voiceId); }}
          onClose={() => setEssentialTourOpen(false)}
        />
      )}
      {shortcutHelpOpen && <ShortcutHelp onClose={() => setShortcutHelpOpen(false)} />}
      {voiceJourneyCeremony && ceremonyJourney && ceremonyVoices.length > 0 && (
        <VoiceJourneyCeremony
          phase={voiceJourneyCeremony.phase}
          journey={ceremonyJourney}
          voices={ceremonyVoices}
          narrationOn={voiceJourneyNarrationOn}
          narrationRate={voiceJourneyNarrationRate}
          onToggleNarration={() => setVoiceJourneyNarrationOn((value) => !value)}
          onCycleNarrationRate={cycleVoiceNarrationRate}
          onBegin={beginVoiceJourney}
          onReplay={replayVoiceJourney}
          onClose={closeVoiceImmersion}
        />
      )}

      {prologueVisible && (
        <section className="prologue" aria-label="时光地球序章">
          <div className="prologue-years" aria-hidden="true">
            {PROLOGUE_YEARS.map((year, index) => (
              <span
                key={year}
                style={{ "--year-index": index } as CSSProperties}
              >
                {year < 0 ? `−${Math.abs(year)}` : year}
              </span>
            ))}
          </div>
          <div className="prologue-copy">
            <p>PAST IS NOT A DISTANT COUNTRY</p>
            <h1>过去五千年</h1>
            <h2>无数文明，在同一颗星球上留下了光</h2>
          </div>
          <div className="prologue-metrics" aria-label="历史档案规模">
            <span>
              <strong>{places.length}</strong>
              历史坐标
            </span>
            <span>
              <strong>{TOTAL_EVENTS}</strong>
              时间切片
            </span>
            <span>
              <strong>{MAX_YEAR - MIN_YEAR}</strong>
              年文明跨度
            </span>
          </div>
          <button
            className="prologue-skip"
            type="button"
            onClick={() => {
              setGlobeEnabled(true);
              setPrologueVisible(false);
            }}
          >
            跳过序章
          </button>
        </section>
      )}

      <div className="globe-stage" aria-label="可交互三维地球">
        <GlobeScene
          places={globePlaces}
          voices={focusMode ? [] : globeVoices}
          currentYear={currentYear}
          selectedId={selectedId}
          routeCategoryFilter={routeCategoryFilter}
          minimalMode={focusMode}
          routeLensActive={focusMode && focusLens === "routes"}
          landmarkLensActive={focusMode && focusLens === "landmarks"}
          openingPlaceId={openingPlaceId}
          openingPhase={openingStage}
          performanceMode={reducedMotion ? "low" : performanceMode}
          enabled={globeEnabled}
          onPerformanceTierChange={setActivePerformanceTier}
          onRuntimePerformance={({ fps, adapted }) => {
            setRuntimeFps(fps);
            if (adapted) {
              setAutoAdaptNotice(true);
              window.setTimeout(() => setAutoAdaptNotice(false), 2600);
            }
          }}
          onCameraSettled={({ longitude, latitude, altitudeKm }) => {
            cameraAnnouncementKey.current += 1;
            setCameraAnnouncement({
              key: cameraAnnouncementKey.current,
              destination: selectedPlace?.name ??
                `纬度 ${Math.abs(latitude).toFixed(1)} 度${latitude >= 0 ? "北" : "南"}、经度 ${Math.abs(longitude).toFixed(1)} 度${longitude >= 0 ? "东" : "西"}`,
              altitudeKm,
            });
          }}
          onClusterExpand={({ regionName, placeCount }) => {
            clusterAnnouncementKey.current += 1;
            setClusterAnnouncement({
              key: clusterAnnouncementKey.current,
              regionName,
              placeCount,
            });
          }}
          onRouteHover={setHoveredRoute}
          onRouteSelect={(route) => setPinnedRoute(route)}
          onPlaceHover={setHoveredPlaceId}
          onSelect={(id) => {
            setActiveJourneyId(null);
            selectPlace(id);
          }}
        />
        <div className="space-haze" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
      </div>

      {openingActive && (
        <section
          className={`civilization-opening is-${openingStage}`}
          aria-label="随机文明地点开场"
        >
          {openingMedia && (
            <figure aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={openingMedia.imageUrl}
                alt=""
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
              <figcaption>ARCHIVE IMAGE · {openingMedia.credit}</figcaption>
            </figure>
          )}
          {openingPlace && openingEvent && (
            <article>
              <span>RANDOM CIVILIZATION COORDINATE</span>
              <p>{openingPlace.country} · {openingPlace.eraLabel}</p>
              <h1>{openingPlace.name}</h1>
              <div><b>{formatYear(openingEvent.year)}</b><i /></div>
              <h2>{openingEvent.title}</h2>
              <blockquote>{openingEvent.summary}</blockquote>
            </article>
          )}
          <footer>
            <span>从一个文明坐标，看见整颗地球</span>
            <button type="button" onClick={finishOpening}>进入时光地球 <b aria-hidden="true">→</b></button>
          </footer>
        </section>
      )}

      {activeLensGuide && lensGuideStep !== null && !openingActive && (
        <>
          <div className="lens-discovery-backdrop" aria-hidden="true" />
          <section
            ref={lensGuideDialogRef}
            tabIndex={-1}
            className={`lens-discovery-card is-${activeLensGuide.id}`}
            role="dialog"
            aria-modal="true"
            aria-label={`发现观察镜头：${activeLensGuide.label}`}
          >
            <header>
              <span>FIRST ORBIT · OBSERVATION LENS</span>
              <button type="button" onClick={finishLensGuide}>跳过引导</button>
            </header>
            <div className="lens-discovery-card__index" aria-hidden="true">
              {activeLensGuide.index}
            </div>
            <p>{activeLensGuide.english}</p>
            <h2>{activeLensGuide.label}</h2>
            <blockquote>{activeLensGuide.guide}</blockquote>
            <div className="lens-discovery-card__signal">
              <i aria-hidden="true" />
              <span>
                {activeLensGuide.id === "landmarks"
                  ? `${places.length} 座文明坐标等待发现`
                  : activeLensGuide.id === "routes"
                    ? `${activeRoutes.length} 条路线在 ${formatYear(currentYear)} 活跃`
                    : `${historicalVoices.length} 段历史之声环绕地球`}
              </span>
            </div>
            <footer>
              <div aria-label={`引导进度 ${lensGuideStep + 1} / ${FOCUS_LENSES.length}`}>
                {FOCUS_LENSES.map((lens, index) => (
                  <i key={lens.id} className={index === lensGuideStep ? "active" : ""} />
                ))}
              </div>
              <nav aria-label="引导步骤">
                {lensGuideStep > 0 && (
                  <button type="button" onClick={() => setLensGuideStep(lensGuideStep - 1)}>
                    上一步
                  </button>
                )}
                <button
                  className="primary"
                  type="button"
                  data-modal-autofocus
                  onClick={() => {
                    if (lensGuideStep >= FOCUS_LENSES.length - 1) finishLensGuide();
                    else setLensGuideStep(lensGuideStep + 1);
                  }}
                >
                  {lensGuideStep >= FOCUS_LENSES.length - 1 ? "开始自由探索" : "看下一个镜头"}
                  <b aria-hidden="true">→</b>
                </button>
              </nav>
            </footer>
          </section>
        </>
      )}

      {lensTransition && lensTransitionTarget && !openingActive && (
        <div className="lens-cinematic-transition" aria-live="polite">
          <div className="lens-cinematic-transition__iris" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="lens-cinematic-transition__copy">
            <span>OBSERVATION LENS · {lensTransitionTarget.index}</span>
            <strong>{lensTransitionTarget.label}</strong>
            <small>{lensTransitionTarget.english}</small>
          </div>
          <div className="lens-cinematic-transition__scan" aria-hidden="true" />
        </div>
      )}

      {!introVisible &&
        !openingActive &&
        !selectedPlace &&
        !storyOpen &&
        !civilizationNetworkOpen &&
        !regionNavigatorOpen &&
        !performanceOpen &&
        (!focusMode || focusLens !== "routes") && (
          <CivilizationNebula
            currentYear={currentYear}
            onSelect={openVoiceImmersion}
            sparse={focusMode && focusLens !== "voices"}
          />
        )}

      <GlobeAccessibilityAnnouncer
        performanceTier={activePerformanceTier}
        camera={cameraAnnouncement}
        expandedCluster={clusterAnnouncement}
        selectedPlace={selectedPlace}
        activeEvent={announcedEvent}
      />

      {autoAdaptNotice && (
        <p className="performance-adapt-toast" role="status">
          已根据实时帧率自动降低一级画质
        </p>
      )}

      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => {
            setIntroVisible(false);
            setSelectedId(null);
            setStoryOpen(false);
            setActiveJourneyId(null);
            setMediaLightboxOpen(false);
            setVoiceArchiveOpen(false);
            setVoiceObservatoryOpen(false);
            setExperienceHubOpen(false);
            closeVoiceImmersion();
          }}
          aria-label="返回全球探索"
        >
          <span className="brand-mark" aria-hidden="true">
            CE
          </span>
          <span>
            <strong>CHRONO EARTH</strong>
            <small>时光地球</small>
          </span>
        </button>

        <nav className="top-actions" aria-label="全局工具">
          <button
            className="observatory-button"
            type="button"
            onClick={() => setVoiceObservatoryOpen(true)}
            aria-haspopup="dialog"
          >
            观测台 <span>Ⅴ</span>
          </button>
          <button className="explore-center-button" type="button" onClick={() => setExperienceHubOpen(true)} aria-haspopup="dialog">
            探索 <span>⌘K</span>
          </button>
          <button
            className="sound-button"
            type="button"
            onClick={() => setSoundOn((value) => !value)}
            aria-label={soundOn ? "关闭环境声音" : "打开环境声音"}
          >
            <span className={soundOn ? "sound-bars active" : "sound-bars"}>
              <i />
              <i />
              <i />
            </span>
            {soundOn ? "声音开启" : "静音"}
          </button>
        </nav>
      </header>

      {focusMode &&
        !openingActive &&
        !prologueVisible &&
        !introVisible &&
        !selectedPlace &&
        !storyOpen && (
          <aside className="world-tool-rail" aria-label="地球探索工具栏">
            <span className="world-tool-rail__eyebrow" aria-hidden="true">
              NAVIGATE
            </span>
            <nav>
              <button
                className={searchOpen ? "active" : ""}
                type="button"
                onClick={toggleQuickSearch}
                aria-label="搜索历史地点"
                aria-expanded={searchOpen}
              >
                <i aria-hidden="true">⌕</i>
                <span>搜索</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeUtilityPanels();
                  randomExplore();
                }}
                aria-label="随机抵达一个文明地点"
              >
                <i aria-hidden="true">✦</i>
                <span>漫游</span>
              </button>
              <button
                className={lensPanelOpen ? "active" : ""}
                type="button"
                onClick={toggleFocusLens}
                aria-label="切换地球观察镜头"
                aria-expanded={lensPanelOpen}
              >
                <i aria-hidden="true">◎</i>
                <span>{focusLens === "landmarks" ? "镜头" : focusLens === "routes" ? "航线" : "声音"}</span>
              </button>
              <button
                className={filterOpen ? "active" : ""}
                type="button"
                onClick={toggleQuickFilter}
                aria-label="筛选历史地点"
                aria-expanded={filterOpen}
              >
                <i aria-hidden="true">◫</i>
                <span>筛选</span>
              </button>
              <button
                className={soundOn ? "active" : ""}
                type="button"
                onClick={() => setSoundOn((value) => !value)}
                aria-label={soundOn ? "关闭环境声音" : "打开环境声音"}
                aria-pressed={soundOn}
              >
                <i className="rail-sound" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                </i>
                <span>{soundOn ? "有声" : "声音"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeUtilityPanels();
                  setExperienceHubOpen(true);
                }}
                aria-label="打开完整探索中心"
                aria-haspopup="dialog"
              >
                <i aria-hidden="true">•••</i>
                <span>更多</span>
              </button>
            </nav>
          </aside>
        )}

      {focusMode &&
        lensPanelOpen &&
        !openingActive &&
        !selectedPlace && (
          <section
            ref={lensPanelDialogRef}
            tabIndex={-1}
            className="world-lens-panel"
            role="dialog"
            aria-modal="true"
            aria-label="选择地球观察镜头"
          >
            <header>
              <span>OBSERVATION LENS</span>
              <strong>选择观察世界的方式</strong>
              <button type="button" onClick={() => setLensPanelOpen(false)} aria-label="关闭观察镜头">×</button>
            </header>
            <div>
              {FOCUS_LENSES.map((lens) => (
                <button
                  key={lens.id}
                  className={focusLens === lens.id ? "active" : ""}
                  type="button"
                  onClick={() => {
                    requestFocusLens(lens.id);
                    setLensPanelOpen(false);
                  }}
                  aria-pressed={focusLens === lens.id}
                  data-modal-autofocus={focusLens === lens.id ? true : undefined}
                >
                  <i>{lens.index}</i>
                  <span>
                    <strong>{lens.label}</strong>
                    <small>{lens.english}</small>
                    <p>{lens.description}</p>
                  </span>
                  <b aria-hidden="true">{focusLens === lens.id ? "●" : "○"}</b>
                </button>
              ))}
            </div>
            <footer>{formatYear(currentYear)} · 所有镜头随时间轴同步变化</footer>
          </section>
        )}

      {focusMode && focusLens === "routes" && routePreview && (
        <aside
          className={`route-encounter-card${pinnedRoute?.id === routePreview.id ? " is-pinned" : ""}`}
          aria-live="polite"
          style={
            {
              "--route-accent": routePreviewCategory?.accent ?? "#d9a65a",
            } as CSSProperties
          }
        >
          <header>
            <span>{routePreviewCategory?.englishLabel ?? routePreview.category}</span>
            <i>{routePreviewCategory?.symbol ?? "◇"}</i>
            <button type="button" onClick={() => { setPinnedRoute(null); setHoveredRoute(null); }} aria-label="关闭航线信息">×</button>
          </header>
          <p>
            {pinnedRoute?.id === routePreview.id
              ? "PINNED ROUTE · 点击航线可重新固定"
              : currentYear >= routePreview.period[0] && currentYear <= routePreview.period[1]
                ? "ACTIVE IN THIS TIME SLICE · 点击固定"
              : "HISTORICAL ECHO"}
          </p>
          <h3>{routePreview.label}</h3>
          <div>
            <strong>{routePreview.fromName}</strong>
            <i aria-hidden="true"><b /></i>
            <strong>{routePreview.toName}</strong>
          </div>
          <blockquote>{routePreviewCategory?.description}</blockquote>
          <footer>
            <span>{formatYear(routePreview.period[0])} — {formatYear(routePreview.period[1])}</span>
            <nav aria-label="抵达航线端点">
              <button type="button" onClick={() => { setPinnedRoute(null); selectPlace(routePreview.fromId); }}>起点</button>
              <button type="button" onClick={() => { setPinnedRoute(null); selectPlace(routePreview.toId); }}>终点</button>
            </nav>
          </footer>
        </aside>
      )}

      {focusMode &&
        focusLens === "landmarks" &&
        hoveredLandmark &&
        !selectedPlace &&
        !openingActive && (
          <aside className="landmark-encounter-card" aria-live="polite">
            <header>
              <span>LANDMARK COORDINATE</span>
              <i aria-hidden="true">⌖</i>
            </header>
            <p>{hoveredLandmark.country} · {hoveredLandmark.eraLabel}</p>
            <h3>{hoveredLandmark.name}</h3>
            <strong>{hoveredLandmark.localName}</strong>
            {hoveredLandmarkEvent && (
              <blockquote>
                <small>{formatYear(hoveredLandmarkEvent.year)}</small>
                <b>{hoveredLandmarkEvent.title}</b>
                <span>{hoveredLandmarkEvent.summary}</span>
              </blockquote>
            )}
            <footer>
              <span>
                {formatCoordinate(hoveredLandmark.coordinates[1], "N", "S")} ·{" "}
                {formatCoordinate(hoveredLandmark.coordinates[0], "E", "W")}
              </span>
              <em>{hoveredLandmarkConnections} 条文明关联 · 点击打开档案</em>
            </footer>
          </aside>
        )}

      {focusMode &&
        focusLens === "routes" &&
        !openingActive &&
        !selectedPlace && (
          <nav className="route-lens-categories" aria-label="文明航线类型">
            <button
              className={routeCategoryFilter === null ? "active" : ""}
              type="button"
              onClick={() => setRouteCategoryFilter(null)}
              aria-pressed={routeCategoryFilter === null}
            >
              <i>∞</i><span>全部</span>
            </button>
            {routeCategories.map((category) => (
              <button
                key={category.id}
                className={routeCategoryFilter === category.id ? "active" : ""}
                type="button"
                onClick={() => setRouteCategoryFilter(category.id)}
                aria-pressed={routeCategoryFilter === category.id}
                style={{ "--category-accent": category.accent } as CSSProperties}
              >
                <i>{category.symbol}</i><span>{category.label}</span>
              </button>
            ))}
          </nav>
        )}

      {searchOpen && (
        <div
          ref={searchDialogRef}
          tabIndex={-1}
          className="search-panel quick-search-panel"
          role="dialog"
          aria-modal="true"
          aria-label="搜索历史地点"
        >
          <header>
            <span>DIRECT COORDINATE</span>
            <strong>抵达一个历史坐标</strong>
            <button type="button" onClick={() => setSearchOpen(false)} aria-label="关闭搜索">×</button>
          </header>
          <label htmlFor="place-search">搜索地点、国家或时代</label>
          <input
            ref={searchRef}
            id="place-search"
            data-modal-autofocus
            value={searchQuery}
            placeholder="例如：庞贝、丝绸之路、埃及"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <div className="quick-search-panel__results" aria-live="polite">
            <p>{searchQuery.trim() ? `${quickSearchResults.length} 个匹配坐标` : "推荐抵达"}</p>
            {quickSearchResults.map((place, index) => (
              <button
                key={place.id}
                type="button"
                onClick={() => {
                  selectPlace(place.id);
                  setCurrentYear(place.events[0]?.year ?? currentYear);
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              >
                <i>{String(index + 1).padStart(2, "0")}</i>
                <span>
                  <strong>{place.name}</strong>
                  <small>{place.country} · {place.eraLabel}</small>
                </span>
                <b aria-hidden="true">→</b>
              </button>
            ))}
            {quickSearchResults.length === 0 && <p className="quick-search-panel__empty">没有找到这个坐标，试试国家或时代名称。</p>}
          </div>
        </div>
      )}

      {filterOpen && (
        <aside className="filter-panel" aria-label="探索筛选器">
          <div className="filter-heading">
            <span>EXPLORATION LENS</span>
            <strong>
              {filteredPlaces.length} <small>/ {places.length}</small>
            </strong>
            <button type="button" onClick={() => setFilterOpen(false)}>
              ×
            </button>
          </div>
          <fieldset>
            <legend>区域 REGION</legend>
            <div className="filter-options regions">
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  className={regionFilter === region.id ? "active" : ""}
                  type="button"
                  onClick={() => setRegionFilter(region.id)}
                >
                  {region.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>主题 THEME</legend>
            <div className="filter-options themes">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  className={themeFilter === theme.id ? "active" : ""}
                  type="button"
                  onClick={() => setThemeFilter(theme.id)}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>年代 ERA</legend>
            <div className="filter-options eras">
              <button
                className={eraFilter === "all" ? "active" : ""}
                type="button"
                onClick={() => setEraFilter("all")}
              >
                全时段
              </button>
              {eras.map((era) => (
                <button
                  key={era.id}
                  className={eraFilter === era.id ? "active" : ""}
                  type="button"
                  onClick={() => setEraFilter(era.id)}
                >
                  {era.label}
                </button>
              ))}
            </div>
          </fieldset>
          <button
            className="filter-reset"
            type="button"
            onClick={() => {
              setRegionFilter("all");
              setThemeFilter("all");
              setEraFilter("all");
            }}
          >
            重置观察镜头
          </button>
          <button
            className="filter-show-results"
            type="button"
            disabled={filteredPlaces.length === 0}
            onClick={() => {
              setFilterResultIndex(0);
              setFilterOpen(false);
              setResultsOpen(true);
              if (filteredPlaces[0]) selectPlace(filteredPlaces[0].id);
            }}
          >
            查看 {filteredPlaces.length} 个结果
          </button>
        </aside>
      )}

      {resultsOpen && (
        <FilterResults
          places={filteredPlaces}
          currentIndex={safeFilterResultIndex}
          onSelect={(id) => {
            const index = filteredPlaces.findIndex((place) => place.id === id);
            if (index >= 0) setFilterResultIndex(index);
            selectPlace(id);
          }}
          onPrevious={() => moveFilterResult(safeFilterResultIndex - 1)}
          onNext={() => moveFilterResult(safeFilterResultIndex + 1)}
          onClose={() => setResultsOpen(false)}
        />
      )}

      {favoritesOpen && (
        <aside className="favorites-panel" aria-label="我的历史收藏">
          <div>
            <span>PERSONAL ARCHIVE</span>
            <strong>我的历史收藏</strong>
            <button type="button" onClick={() => setFavoritesOpen(false)}>
              ×
            </button>
          </div>
          {favoriteIds.length === 0 ? (
            <p>打开一个历史坐标，将它收入你的私人档案。</p>
          ) : (
            favoriteIds.map((id, index) => {
              const place = places.find((candidate) => candidate.id === id);
              if (!place) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    selectPlace(id);
                    setFavoritesOpen(false);
                  }}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>
                    <b>{place.name}</b>
                    <small>{place.country} · {place.eraLabel}</small>
                  </span>
                </button>
              );
            })
          )}
        </aside>
      )}

      {regionNavigatorOpen && (
        <RegionNavigator
          places={places}
          onSelect={(id) => {
            selectPlace(id);
            setRegionNavigatorOpen(false);
          }}
          onClose={() => setRegionNavigatorOpen(false)}
        />
      )}

      {performanceOpen && (
        <GlobePerformanceControls
          mode={performanceMode}
          activeTier={activePerformanceTier}
          runtimeFps={runtimeFps}
          onChange={(mode) => {
            setPerformanceMode(mode);
            try {
              window.localStorage.setItem(
                "chrono-earth:performance-mode",
                mode,
              );
            } catch {
              // The manual choice still works when storage is unavailable.
            }
          }}
          onClose={() => setPerformanceOpen(false)}
        />
      )}

      {offlinePacksOpen && (
        <aside
          ref={offlinePacksDialogRef}
          tabIndex={-1}
          className="offline-packs-panel"
          role="dialog"
          aria-modal="true"
          aria-label="离线历史旅程"
        >
          <button
            className="offline-packs-close"
            type="button"
            onClick={() => setOfflinePacksOpen(false)}
            aria-label="关闭离线历史旅程"
          >
            ×
          </button>
          <OfflineJourneyPacks
            onStartJourney={(journeyId) => {
              setOfflinePacksOpen(false);
              startJourney(journeyId);
            }}
          />
        </aside>
      )}

      {civilizationNetworkOpen && (
        <CivilizationNetwork
          places={places}
          routes={historyRoutes}
          currentYear={currentYear}
          onSelect={(id) => {
            setCivilizationNetworkOpen(false);
            selectPlace(id);
          }}
          onClose={() => setCivilizationNetworkOpen(false)}
        />
      )}

      {introVisible && (
        <section
          className="intro-overlay"
          aria-labelledby="intro-title"
          aria-hidden={prologueVisible}
        >
          <p className="eyebrow">A LIVING ARCHIVE OF HUMANITY</p>
          <h1 id="intro-title">
            每一片土地
            <span>都曾见证时间</span>
          </h1>
          <p className="intro-copy">
            转动地球，拨动时间。你可以自由凝望世界，也可以从一段声音或一条短旅程开始。
          </p>
          <div className="intro-paths">
            <button className="enter-button" type="button" onClick={startExploring}><span>转动地球</span><b aria-hidden="true">→</b><small>自由探索五千年</small></button>
            <button type="button" onClick={() => { setIntroVisible(false); setEssentialTourOpen(true); }}><span>三分钟导览</span><b aria-hidden="true">Ⅱ</b><small>沿五段声音理解网站</small></button>
            <button type="button" onClick={() => { setIntroVisible(false); openVoiceImmersion(DAILY_VOICE.placeId, DAILY_VOICE.id); }}><span>听今日原声</span><b aria-hidden="true">Ⅲ</b><small>{DAILY_VOICE.author} · {DAILY_VOICE.work}</small></button>
          </div>
          <p className="gesture-hint">
            <span aria-hidden="true">↔</span> 拖动地球 · 滚动缩放 · 按 ? 查看快捷键
          </p>
        </section>
      )}

      {!introVisible &&
        !storyOpen &&
        !focusMode &&
        !selectedPlace &&
        !activeJourney && (
          <section className="journey-library" aria-label="策展旅程">
            <button
              className="daily-archive"
              type="button"
              onClick={openDailyArchive}
              aria-label={`今日历史坐标：${DAILY_PLACE.name}，${formatYear(DAILY_EVENT?.year ?? DAILY_PLACE.period[0])}`}
            >
              <i>今日</i>
              <span className="daily-archive-copy">
                <small>{DAILY_DATE_LABEL} · DAILY ARCHIVE</small>
                <b>{DAILY_PLACE.name}</b>
                <em>{formatYear(DAILY_EVENT?.year ?? DAILY_PLACE.period[0])}</em>
              </span>
              <strong aria-hidden="true">↗</strong>
            </button>
            <div className="journey-library-heading">
              <span>CURATED EXPEDITIONS</span>
              <strong>沿一条线，穿过一个时代</strong>
              <button className="offline-packs-trigger" type="button" onClick={() => setExperienceHubOpen(true)}>全部能力 · ⌘K</button>
            </div>
            <div className="journey-cards">
              {journeys.slice(0, 3).map((journey, index) => (
                <button
                  key={journey.id}
                  type="button"
                  onClick={() => startJourney(journey.id)}
                  style={{ "--journey-accent": journey.accent } as CSSProperties}
                  aria-label={`${journey.title}：${journey.englishTitle}，${journey.chapters.length} 站`}
                >
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>
                    <b>{journey.title}</b>
                    <small>{journey.englishTitle}</small>
                  </span>
                  <em>{journey.chapters.length} STOPS</em>
                </button>
              ))}
            </div>
          </section>
        )}

      {activeJourney && activeJourneyChapter && !storyOpen && (
        <>
          <JourneyTransition
            key={`${activeJourney.id}:${journeyChapter}`}
            journeyTitle={activeJourney.title}
            englishTitle={activeJourney.englishTitle}
            chapterIndex={journeyChapter}
            chapterCount={activeJourney.chapters.length}
            yearLabel={formatYear(activeJourneyChapter.year)}
            placeName={
              places.find(({ id }) => id === activeJourneyChapter.placeId)?.name ??
              activeJourneyChapter.title
            }
            chapterTitle={activeJourneyChapter.title}
          />
          <aside
            className="journey-player"
            style={{ "--journey-accent": activeJourney.accent } as CSSProperties}
            aria-live="polite"
          >
          <button
            className="journey-exit"
            type="button"
            onClick={exitJourney}
            aria-label="退出策展旅程"
          >
            ×
          </button>
          <span className="journey-kicker">{activeJourney.englishTitle}</span>
          <button
            className={journeyNarrationOn ? "journey-voice active" : "journey-voice"}
            type="button"
            onClick={() => setJourneyNarrationOn((value) => !value)}
            aria-label={journeyNarrationOn ? "关闭旅程旁白" : "开启旅程旁白"}
          >
            {journeyNarrationOn ? "VOICE ON" : "VOICE OFF"}
          </button>
          <button
            className="journey-share"
            type="button"
            onClick={() => void shareCurrentView()}
          >
            {shareCopied ? "LINK READY" : "SHARE"}
          </button>
          <div className="journey-position">
            {String(journeyChapter + 1).padStart(2, "0")} /{" "}
            {String(activeJourney.chapters.length).padStart(2, "0")}
          </div>
          <h2>{activeJourney.title}</h2>
          <p className="journey-year">{formatYear(activeJourneyChapter.year)}</p>
          <h3>{activeJourneyChapter.title}</h3>
          <p className="journey-narration">
            {activeJourneyChapter.narration}
          </p>
          <div className="journey-stops" aria-label="旅程进度">
            {activeJourney.chapters.map((chapter, index) => (
              <button
                key={`${activeJourney.id}-${chapter.placeId}`}
                className={index === journeyChapter ? "active" : ""}
                type="button"
                onClick={() => moveJourney(index)}
                aria-label={`第 ${index + 1} 站：${chapter.title}`}
              />
            ))}
          </div>
          <div className="journey-controls">
            <button
              type="button"
              onClick={() => moveJourney(journeyChapter - 1)}
              disabled={journeyChapter === 0}
            >
              上一站
            </button>
            <button
              type="button"
              onClick={
                journeyChapter === activeJourney.chapters.length - 1
                  ? exitJourney
                  : () => moveJourney(journeyChapter + 1)
              }
            >
              {journeyChapter === activeJourney.chapters.length - 1
                ? "完成旅程"
                : "飞向下一站"}
            </button>
          </div>
          </aside>
        </>
      )}

      {!introVisible && selectedPlace && !storyOpen && !activeJourney && (
        <div
          key={selectedPlace.id}
          className="time-arrival"
          aria-hidden="true"
        >
          <span>{formatYear(visibleEvent?.year ?? currentYear)}</span>
          <i>{selectedPlace.name} · HISTORY COORDINATE ACQUIRED</i>
        </div>
      )}

      {!introVisible && selectedPlace && !storyOpen && !activeJourney && !resultsOpen && (
        <aside
          className={`place-panel archive-exhibition is-layer-${archiveLayer}`}
          id="place-panel"
          aria-live="polite"
          style={{ "--place-accent": selectedPlace.accent } as CSSProperties}
        >
          <button
            className="panel-close"
            type="button"
            onClick={() => {
              setSelectedId(null);
              setMediaLightboxOpen(false);
            }}
            aria-label="关闭景点信息"
          >
            ×
          </button>
          <header className="archive-exhibition__header">
            <span>HISTORICAL COORDINATE</span>
            <i>ARCHIVE {String(places.findIndex(({ id }) => id === selectedPlace.id) + 1).padStart(2, "0")}</i>
          </header>
          <nav className="archive-layer-nav" aria-label="历史档案层级">
            {ARCHIVE_LAYERS.map((layer) => (
              <button
                key={layer.id}
                className={archiveLayer === layer.id ? "active" : ""}
                type="button"
                onClick={() => setArchiveLayer(layer.id)}
                aria-pressed={archiveLayer === layer.id}
              >
                <i>{layer.index}</i>
                <span>{layer.label}<small>{layer.english}</small></span>
              </button>
            ))}
          </nav>

          {archiveLayer === "place" && selectedMedia && (
            <figure className="place-media">
              {/* Local archive media is loaded only after this panel opens. */}
              <button
                className="place-media-open"
                type="button"
                onClick={() => setMediaLightboxOpen(true)}
                aria-label={`全屏查看${selectedPlace.name}历史影像`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedMedia.imageUrl}
                  alt={selectedMedia.caption}
                  loading="lazy"
                />
                <span aria-hidden="true">EXPAND ↗</span>
              </button>
              <figcaption>
                <span>{selectedMedia.caption}</span>
                <small>{selectedMedia.credit}</small>
              </figcaption>
            </figure>
          )}

          {archiveLayer === "place" && (
            <section className="archive-layer archive-layer-place">
              <p className="panel-kicker">{selectedPlace.country} · {selectedPlace.eraLabel}</p>
              <h2>{selectedPlace.name}</h2>
              {selectedPlace.localName && <p className="local-name">{selectedPlace.localName}</p>}
              <p className="place-summary">{selectedPlace.summary}</p>
              <dl className="archive-coordinate-ledger">
                <div><dt>LATITUDE</dt><dd>{formatCoordinate(selectedPlace.coordinates[1], "N", "S")}</dd></div>
                <div><dt>LONGITUDE</dt><dd>{formatCoordinate(selectedPlace.coordinates[0], "E", "W")}</dd></div>
                <div><dt>SPAN</dt><dd>{formatYear(selectedPlace.period[0])} — {formatYear(selectedPlace.period[1])}</dd></div>
              </dl>
            </section>
          )}

          {archiveLayer === "chronicle" && (
            <section className="archive-layer archive-chronicle">
              <p className="archive-layer-kicker">CHRONICLE · {selectedPlace.events.length} TIME SLICES</p>
              <h2>{selectedPlace.name}纪年</h2>
              <div>
                {selectedPlace.events.map((event, index) => (
                  <button
                    key={`${selectedPlace.id}-${event.year}`}
                    className={event.year === visibleEvent?.year ? "active" : ""}
                    type="button"
                    onClick={() => setCurrentYear(event.year)}
                  >
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    <span><small>{formatYear(event.year)}</small><strong>{event.title}</strong><p>{event.summary}</p></span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {archiveLayer === "voice" && selectedVoice && (
            <section className="archive-layer archive-voice-layer">
              <p className="archive-layer-kicker">PRIMARY TEXT · {selectedVoice.language}</p>
              <h2>来自这个坐标的声音</h2>
            <blockquote className="historical-voice-card">
              <p lang={selectedVoice.language === "日语" ? "ja" : undefined}>
                {selectedVoice.text}
              </p>
              <small>{selectedVoice.translation}</small>
              <footer>
                <span>{selectedVoice.author} · {selectedVoice.work}</span>
                <a
                  href={selectedVoice.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看原典 ↗
                </a>
              </footer>
              <button
                className="historical-voice-enter"
                type="button"
                onClick={() => openVoiceImmersion(selectedVoice.placeId, selectedVoice.id)}
              >
                沉浸聆听这段原声 →
              </button>
            </blockquote>
            </section>
          )}
          {archiveLayer === "voice" && !selectedVoice && (
            <section className="archive-layer archive-empty-layer">
              <i aria-hidden="true">◌</i><h2>原始文本仍待归档</h2><p>这个坐标已有历史事件记录，文字与口述材料将在后续档案中补充。</p>
            </section>
          )}
          {archiveLayer === "voice" && visibleSources.length > 0 && (
            <div className="source-ledger" aria-label="史料来源">
              <span>
                {visibleEventSources.length > 0 ? "EVENT SOURCE" : "SOURCE LEDGER"} ·{" "}
                {visibleSources[0].confidence.toUpperCase()}
              </span>
              {visibleSources.slice(0, 2).map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  title={source.note}
                >
                  <b>{source.publisher}</b>
                  <small>{source.title}</small>
                </a>
              ))}
            </div>
          )}

          {archiveLayer === "connections" && (
            <section className="archive-layer archive-connections">
              <p className="archive-layer-kicker">CIVILIZATION THREADS · {selectedConnections.length}</p>
              <h2>从这里，抵达别处</h2>
              {selectedConnections.length > 0 ? (
                <div>
                  {selectedConnections.slice(0, 6).map(({ route, destination, category }) => (
                    <button key={route.id} type="button" onClick={() => destination && selectPlace(destination.id)}>
                      <i style={{ "--thread-accent": category.accent } as CSSProperties}>{category.symbol}</i>
                      <span><small>{category.label} · {formatYear(route.period[0])}—{formatYear(route.period[1])}</small><strong>{route.label}</strong><p>{selectedPlace.name} → {destination?.name}</p></span>
                      <b aria-hidden="true">↗</b>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="archive-empty-layer"><i aria-hidden="true">◇</i><h3>关联路线仍待辨认</h3><p>这个地点暂未接入文明路线档案。</p></div>
              )}
            </section>
          )}

          <div className="archive-actions">
            <button
              className={favoriteIds.includes(selectedPlace.id) ? "active" : ""}
              type="button"
              onClick={() => toggleFavorite(selectedPlace.id)}
            >
              {favoriteIds.includes(selectedPlace.id) ? "★ 已收藏" : "☆ 收藏坐标"}
            </button>
            <button type="button" onClick={() => void shareCurrentView()}>
              {shareCopied ? "链接已复制" : "分享此刻"}
            </button>
          </div>
          <button className="story-button" type="button" onClick={openStory}>
            进入历史现场
            <span aria-hidden="true">↗</span>
          </button>
        </aside>
      )}

      {!introVisible && !storyOpen && (
        <>
          {focusMode && !selectedPlace && (
            <aside className="minimal-era-chip" aria-live="polite">
              <span>{currentEra.englishLabel}</span>
              <strong>{currentEra.label}</strong>
              <i>{formatYear(currentYear)}</i>
              <em>
                {focusLens === "routes"
                  ? `文明航线 · ${activeRoutes.length} 条活跃`
                  : focusLens === "voices"
                    ? "历史之声 · 点击文字进入"
                    : "历史地标 · 拖动探索"}
              </em>
            </aside>
          )}
          {!focusMode && !selectedPlace && (
            <>
              <aside className="era-context" aria-live="polite">
                <div className="era-context-heading">
                  <span>{currentEra.englishLabel}</span>
                  <strong>{currentEra.label}</strong>
                </div>
                <p>{currentEra.summary}</p>
                <div className="era-route-status">
                  <b>{String(activeRoutes.length).padStart(2, "0")}</b>
                  <span>
                    ACTIVE THREADS
                    <small>{currentEra.routeNarrative}</small>
                  </span>
                </div>
              </aside>
              <aside className="network-console" aria-label="文明网络筛选器">
                <div className="network-heading">
                  <span>CIVILIZATION NETWORK</span>
                  <button
                    className={routeCategoryFilter === null ? "active" : ""}
                    type="button"
                    onClick={() => setRouteCategoryFilter(null)}
                  >
                    全部网络
                  </button>
                </div>
                <div className="network-categories">
                  {routeCategories.map((category) => {
                    const count = activeRoutes.filter(
                      (route) => route.category === category.id,
                    ).length;
                    return (
                      <button
                        key={category.id}
                        className={
                          routeCategoryFilter === category.id ? "active" : ""
                        }
                        type="button"
                        onClick={() =>
                          setRouteCategoryFilter((current) =>
                            current === category.id ? null : category.id,
                          )
                        }
                        style={{ "--route-accent": category.accent } as CSSProperties}
                        aria-label={`${category.label}路线，当前年代 ${count} 条`}
                      >
                        <i aria-hidden="true">{category.symbol}</i>
                        <span>{category.label}</span>
                        <b>{String(count).padStart(2, "0")}</b>
                      </button>
                    );
                  })}
                </div>
                <div className="network-route-list" aria-live="polite">
                  <p>
                    {routeCategoryFilter
                      ? routeCategories.find(
                          ({ id }) => id === routeCategoryFilter,
                        )?.description
                      : "选择一种流动，观察文明如何彼此抵达。"}
                  </p>
                  {visibleRoutes.slice(0, 3).map((route) => (
                    <span key={route.id}>{route.label}</span>
                  ))}
                  {visibleRoutes.length === 0 && <span>这一年，线路仍在沉睡</span>}
                </div>
              </aside>
            </>
          )}
          <section className="timeline-shell" aria-label="世界历史时间轴">
            {timelineTraveling && (
              <div className="timeline-travel-readout" aria-live="polite">
                <span>{timelineDirection === "past" ? "TRAVELING INTO THE PAST" : "TRAVELING TOWARD THE PRESENT"}</span>
                <strong>{timelineDirection === "past" ? "←" : "→"} {formatYear(currentYear)}</strong>
                <small>{timelineVelocity.toLocaleString("zh-CN")} 年 / 秒</small>
              </div>
            )}
            {timelineEcho && timelineTraveling && (
              <div key={timelineEcho.key} className="timeline-milestone-echo" aria-live="polite">
                <i aria-hidden="true" />
                <span>{formatYear(timelineEcho.year)}</span>
                <strong>{timelineEcho.label}</strong>
              </div>
            )}
            <div className="timeline-meta">
              <div>
                <span>NOW EXPLORING</span>
                <strong>{formatYear(currentYear)}</strong>
              </div>
              <button
                className={playing ? "play-button playing" : "play-button"}
                type="button"
                onClick={() => setPlaying((value) => !value)}
                aria-label={playing ? "暂停时间流动" : "播放历史"}
                aria-pressed={playing}
                title={playing ? "暂停时间流动" : "播放历史"}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
            </div>
            <div className="timeline-track">
              <input
                type="range"
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={currentYear}
                onPointerDown={beginTimelineTravel}
                onPointerUp={finishTimelineTravel}
                onPointerCancel={finishTimelineTravel}
                onBlur={finishTimelineTravel}
                onChange={(event) => {
                  travelToYear(Number(event.target.value));
                }}
                aria-label="选择历史年份"
                aria-valuetext={`${formatYear(currentYear)}，${currentEra.label}`}
                style={{ "--timeline-progress": `${timelineProgress}%` } as CSSProperties}
              />
              <div className="timeline-milestones" aria-hidden="true">
                {TIMELINE_MILESTONES.map((milestone) => (
                  <i
                    key={milestone.year}
                    className={Math.abs(currentYear - milestone.year) < 12 ? "active" : ""}
                    style={{
                      left: `${((milestone.year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%`,
                    }}
                  />
                ))}
              </div>
              <div className="era-labels" aria-hidden="true">
                {eras.map((era) => (
                  <span key={era.id}>{era.label}</span>
                ))}
              </div>
            </div>
            <div className="timeline-count">
              <strong>{filteredPlaces.length}</strong>
              <span>{filteredPlaces.length === places.length ? "历史坐标" : `已筛选 / ${places.length}`}</span>
            </div>
          </section>
        </>
      )}

      {storyOpen && selectedPlace && (
        <section
          ref={storyDialogRef}
          tabIndex={-1}
          className={`story-mode cinematic-story${storyTransition ? ` is-chapter-${storyTransition.phase} is-moving-${storyTransition.direction < 0 ? "backward" : "forward"}` : ""}${storyExiting ? " is-returning" : ""}`}
          aria-modal="true"
          role="dialog"
          aria-label={`${selectedPlace.name}历史现场`}
        >
          {selectedMedia && (
            <figure className="story-media" aria-hidden="true">
              {/* Reuse the already-requested optional archive image as atmosphere. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedMedia.imageUrl} alt="" />
            </figure>
          )}
          <div className="story-atmosphere" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          <div className="story-film-subtitle" aria-hidden="true">
            ARCHIVE FILM · {selectedPlace.country.toUpperCase()} · {formatCoordinate(selectedPlace.coordinates[1], "N", "S")}
          </div>
          <div className="story-aperture" aria-hidden="true" />
          <div className="story-year-ghost" aria-hidden="true">
            {selectedPlace.events[storyChapter].year < 0 ? "BCE " : ""}
            {Math.abs(selectedPlace.events[storyChapter].year)}
          </div>
          <button
            className="story-exit"
            type="button"
            onClick={exitStory}
          >
            ← 返回地球
          </button>
          <div className="story-index">
            {String(storyChapter + 1).padStart(2, "0")} /{" "}
            {String(selectedPlace.events.length).padStart(2, "0")}
          </div>
          <div className="story-location">
            <span>{selectedPlace.country}</span>
            <strong>{selectedPlace.name}</strong>
            <small>{currentEra.englishLabel}</small>
          </div>
          <div className="story-copy" key={storyChapter}>
            <p>
              CHAPTER {String(storyChapter + 1).padStart(2, "0")} ·{" "}
              {formatYear(selectedPlace.events[storyChapter].year)}
            </p>
            <h2>{selectedPlace.events[storyChapter].title}</h2>
            <blockquote>
              {selectedPlace.events[storyChapter].summary}
            </blockquote>
            {storyVoice && (
              <div className="story-archive-voice">
                <span>VOICE OF THE PERIOD · {storyVoice.author}</span>
                <p>{storyVoice.text}</p>
                <small>{storyVoice.translation}</small>
              </div>
            )}
            <footer className="story-archive-caption">
              <span>{storySources[0]?.publisher ?? "CHRONO EARTH ARCHIVE"}</span>
              <i />
              <small>{storySources[0]?.title ?? selectedPlace.eraLabel}</small>
            </footer>
          </div>
          {storyTransition && (
            <div className="story-chapter-transition" aria-hidden="true">
              <i />
              <span>{String(storyTransition.target + 1).padStart(2, "0")}</span>
              <small>{formatYear(selectedPlace.events[storyTransition.target]?.year ?? currentYear)}</small>
            </div>
          )}
          {storyExiting && (
            <div className="story-return-orbit" aria-hidden="true">
              <i /><span>RETURNING TO CHRONO EARTH</span>
            </div>
          )}
          <nav className="story-chapter-rail" aria-label="历史章节">
            {selectedPlace.events.map((event, index) => (
              <button
                key={`${selectedPlace.id}-${event.year}`}
                className={index === storyChapter ? "active" : ""}
                type="button"
                onClick={() => moveStoryChapter(index)}
                aria-label={`${formatYear(event.year)}：${event.title}`}
              >
                <i />
                <span>{event.year < 0 ? `−${Math.abs(event.year)}` : event.year}</span>
              </button>
            ))}
          </nav>
          <div className="story-controls">
            <div className="story-progress">
              <i
                style={{
                  width: `${
                    ((storyChapter + 1) / selectedPlace.events.length) * 100
                  }%`,
                }}
              />
            </div>
            <button
              type="button"
              onClick={previousChapter}
              disabled={storyChapter === 0}
            >
              上一章
            </button>
            <button
              type="button"
              onClick={
                storyChapter === selectedPlace.events.length - 1
                  ? exitStory
                  : nextChapter
              }
            >
              {storyChapter === selectedPlace.events.length - 1
                ? "回到地球"
                : "下一章"}
            </button>
          </div>
        </section>
      )}

      {!introVisible && !storyOpen && (
        <p className="coordinate-readout" aria-hidden="true">
          {archiveReadout}
        </p>
      )}
    </main>
  );
}
