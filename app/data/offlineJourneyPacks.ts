import { journeys } from "./journeys";
import { placeMedia } from "./placeMedia";

export const OFFLINE_PACK_MESSAGE_TYPES = {
  install: "CHRONO_JOURNEY_PACK_INSTALL",
  remove: "CHRONO_JOURNEY_PACK_REMOVE",
  query: "CHRONO_JOURNEY_PACK_QUERY",
  progress: "CHRONO_JOURNEY_PACK_PROGRESS",
  complete: "CHRONO_JOURNEY_PACK_COMPLETE",
  error: "CHRONO_JOURNEY_PACK_ERROR",
  state: "CHRONO_JOURNEY_PACK_STATE",
} as const;

const APP_SHELL_RESOURCES = ["/", "/manifest.webmanifest", "/favicon.svg"] as const;

// Kept in source rather than measured at runtime so the estimate also works offline.
const IMAGE_BYTE_ESTIMATES: Readonly<Record<string, number>> = {
  "acropolis-of-athens": 147_444,
  alhambra: 367_430,
  "angkor-wat": 261_436,
  "bamiyan-buddhas": 186_012,
  "chichen-itza": 193_814,
  colosseum: 147_076,
  "dome-of-the-rock": 234_048,
  "forbidden-city": 202_106,
  "hagia-sophia": 306_008,
  lalibela: 222_498,
  "mogao-caves": 192_396,
  "notre-dame-paris": 313_992,
  petra: 149_468,
  "taj-mahal": 158_982,
};

const APP_SHELL_ESTIMATE = 180_000;

export interface OfflineJourneyPack {
  id: string;
  journeyId: string;
  title: string;
  englishTitle: string;
  summary: string;
  accent: string;
  stopCount: number;
  resources: readonly string[];
  estimatedBytes: number;
}

const mediaByPlaceId = new Map(
  placeMedia.map((media) => [media.placeId, media.imageUrl] as const),
);

export const offlineJourneyPacks: readonly OfflineJourneyPack[] = journeys.map(
  (journey) => {
    const imageResources = journey.stopIds
      .map((placeId) => mediaByPlaceId.get(placeId))
      .filter((url): url is string => Boolean(url));
    const resources = [...new Set([...APP_SHELL_RESOURCES, ...imageResources])];
    const estimatedBytes =
      APP_SHELL_ESTIMATE +
      journey.stopIds.reduce(
        (total, placeId) => total + (IMAGE_BYTE_ESTIMATES[placeId] ?? 220_000),
        0,
      );

    return {
      id: journey.id,
      journeyId: journey.id,
      title: journey.title,
      englishTitle: journey.englishTitle,
      summary: journey.summary,
      accent: journey.accent,
      stopCount: journey.stopIds.length,
      resources,
      estimatedBytes,
    };
  },
);

export function formatOfflinePackSize(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.ceil(bytes / 1_000)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default offlineJourneyPacks;
