"use client";

import { useMemo, useState } from "react";

import type { Place } from "../data/places";

interface RegionDefinition {
  id: string;
  label: string;
  englishLabel: string;
  matches: (longitude: number, latitude: number) => boolean;
}

const REGIONS: readonly RegionDefinition[] = [
  { id: "east-asia", label: "东亚", englishLabel: "EAST ASIA", matches: (x, y) => x >= 95 && x < 145 && y >= 20 },
  { id: "south-asia", label: "南亚", englishLabel: "SOUTH ASIA", matches: (x, y) => x >= 60 && x < 95 && y >= 5 && y < 35 },
  { id: "southeast-asia", label: "东南亚", englishLabel: "SOUTHEAST ASIA", matches: (x, y) => x >= 95 && x < 145 && y >= -12 && y < 20 },
  { id: "west-asia", label: "西亚", englishLabel: "WEST ASIA", matches: (x, y) => x >= 30 && x < 65 && y >= 15 && y < 45 },
  { id: "europe", label: "欧洲", englishLabel: "EUROPE", matches: (x, y) => x >= -25 && x < 45 && y >= 35 },
  { id: "north-africa", label: "北非", englishLabel: "NORTH AFRICA", matches: (x, y) => x >= -20 && x < 40 && y >= 15 && y < 35 },
  { id: "sub-saharan-africa", label: "撒哈拉以南非洲", englishLabel: "SUB-SAHARAN AFRICA", matches: (x, y) => x >= -20 && x < 55 && y < 15 },
  { id: "north-america", label: "北美", englishLabel: "NORTH AMERICA", matches: (x, y) => x < -30 && y >= 15 },
  { id: "south-america", label: "南美", englishLabel: "SOUTH AMERICA", matches: (x, y) => x < -30 && y < 15 },
  { id: "oceania", label: "大洋洲", englishLabel: "OCEANIA", matches: (x, y) => (x >= 110 || x < -140) && y < 5 },
  { id: "central-asia", label: "中亚", englishLabel: "CENTRAL ASIA", matches: (x, y) => x >= 45 && x < 95 && y >= 35 },
  { id: "pacific", label: "太平洋岛屿", englishLabel: "PACIFIC ISLANDS", matches: (x, y) => x >= 145 && y >= -30 && y < 25 },
] as const;

interface RegionNavigatorProps {
  places: readonly Place[];
  onSelect: (id: Place["id"]) => void;
  onClose: () => void;
}

export default function RegionNavigator({
  places,
  onSelect,
  onClose,
}: RegionNavigatorProps) {
  const [selectedRegionId, setSelectedRegionId] = useState(REGIONS[0].id);
  const groups = useMemo(
    () =>
      REGIONS.map((region) => ({
        ...region,
        places: places
          .filter(
            (place) =>
              REGIONS.find((candidate) =>
                candidate.matches(...place.coordinates),
              )?.id === region.id,
          )
          .sort(
            (left, right) =>
              right.events.length - left.events.length ||
              left.name.localeCompare(right.name, "zh-CN"),
          ),
      })).filter(({ places: regionPlaces }) => regionPlaces.length > 0),
    [places],
  );
  const selectedGroup =
    groups.find(({ id }) => id === selectedRegionId) ?? groups[0];

  return (
    <aside className="region-navigator" aria-labelledby="region-navigator-title">
      <header>
        <div>
          <span>ACCESSIBLE WORLD INDEX</span>
          <h2 id="region-navigator-title">键盘地域索引</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="关闭地域索引">
          ×
        </button>
      </header>
      <p className="region-navigator-intro">
        无需操作三维画布，也可以按地域访问全部历史坐标。
      </p>
      <nav className="region-index" aria-label="选择世界地域">
        {groups.map((group) => (
          <button
            key={group.id}
            className={group.id === selectedGroup?.id ? "active" : ""}
            type="button"
            onClick={() => setSelectedRegionId(group.id)}
            aria-pressed={group.id === selectedGroup?.id}
          >
            <span>{group.label}</span>
            <small>{group.places.length}</small>
          </button>
        ))}
      </nav>
      {selectedGroup && (
        <section className="region-place-list" aria-live="polite">
          <div>
            <span>{selectedGroup.englishLabel}</span>
            <strong>{selectedGroup.label}</strong>
            <small>{selectedGroup.places.length} 个历史坐标</small>
          </div>
          <ol>
            {selectedGroup.places.slice(0, 8).map((place, index) => (
              <li key={place.id}>
                <button type="button" onClick={() => onSelect(place.id)}>
                  <i>{String(index + 1).padStart(2, "0")}</i>
                  <span>
                    <b>{place.name}</b>
                    <small>{place.country} · {place.eraLabel}</small>
                  </span>
                  <em aria-hidden="true">↗</em>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </aside>
  );
}
