"use client";

import { useId } from "react";

import type { Place } from "../data/places";

export interface FilterResultsProps {
  places: readonly Place[];
  currentIndex: number;
  onSelect: (id: Place["id"]) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

const MAX_VISIBLE_RESULTS = 6;

function formatYear(year: number) {
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

export default function FilterResults({
  places,
  currentIndex,
  onSelect,
  onNext,
  onPrevious,
  onClose,
}: FilterResultsProps) {
  const headingId = useId();
  const currentPlaceId = useId();
  const resultListId = useId();
  const safeIndex =
    places.length === 0
      ? -1
      : Math.min(Math.max(currentIndex, 0), places.length - 1);
  const currentPlace = safeIndex >= 0 ? places[safeIndex] : undefined;
  const maximumListStart = Math.max(0, places.length - MAX_VISIBLE_RESULTS);
  const listStart = Math.min(Math.max(0, safeIndex - 2), maximumListStart);
  const visiblePlaces = places.slice(
    listStart,
    listStart + MAX_VISIBLE_RESULTS,
  );

  return (
    <section className="filter-results" aria-labelledby={headingId}>
      <header className="filter-results__header">
        <div>
          <p className="filter-results__eyebrow">FILTERED ARCHIVE</p>
          <h2 id={headingId} className="filter-results__heading">
            筛选结果
          </h2>
          <p className="filter-results__count" aria-live="polite">
            共 {places.length} 个历史坐标
          </p>
        </div>
        <button
          className="filter-results__close"
          type="button"
          onClick={onClose}
          aria-label="关闭筛选结果"
          title="关闭筛选结果"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      {currentPlace ? (
        <>
          <article
            id={currentPlaceId}
            className="filter-results__current"
            aria-label={`当前地点：${currentPlace.name}`}
          >
            <p className="filter-results__position">
              {String(safeIndex + 1).padStart(2, "0")} / {String(places.length).padStart(2, "0")}
            </p>
            <h3 className="filter-results__title">{currentPlace.name}</h3>
            <p className="filter-results__local-name" lang="und">
              {currentPlace.localName}
            </p>
            <p className="filter-results__meta">
              <span>{currentPlace.country}</span>
              <span aria-hidden="true"> · </span>
              <span>{currentPlace.eraLabel}</span>
            </p>
            <p className="filter-results__period">
              {formatYear(currentPlace.period[0])}—{formatYear(currentPlace.period[1])}
            </p>
            <p className="filter-results__summary">{currentPlace.summary}</p>
          </article>

          <nav className="filter-results__navigation" aria-label="切换筛选结果">
            <button
              className="filter-results__nav-button filter-results__nav-button--previous"
              type="button"
              onClick={onPrevious}
              disabled={safeIndex <= 0}
              aria-controls={currentPlaceId}
            >
              <span aria-hidden="true">←</span>
              上一个
            </button>
            <button
              className="filter-results__nav-button filter-results__nav-button--next"
              type="button"
              onClick={onNext}
              disabled={safeIndex >= places.length - 1}
              aria-controls={currentPlaceId}
            >
              下一个
              <span aria-hidden="true">→</span>
            </button>
          </nav>

          <ol id={resultListId} className="filter-results__list" aria-label="筛选地点列表">
            {visiblePlaces.map((place, visibleIndex) => {
              const absoluteIndex = listStart + visibleIndex;
              const isCurrent = absoluteIndex === safeIndex;

              return (
                <li className="filter-results__item" key={place.id}>
                  <button
                    className={`filter-results__item-button${isCurrent ? " is-current" : ""}`}
                    type="button"
                    onClick={() => onSelect(place.id)}
                    aria-current={isCurrent ? "true" : undefined}
                    aria-label={`${isCurrent ? "当前地点" : "选择"}：${place.name}，${place.country}`}
                  >
                    <span className="filter-results__item-index" aria-hidden="true">
                      {String(absoluteIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="filter-results__item-copy">
                      <span className="filter-results__item-name">{place.name}</span>
                      <span className="filter-results__item-country">{place.country}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <div className="filter-results__empty" role="status">
          <p className="filter-results__empty-title">没有符合条件的历史坐标</p>
          <p className="filter-results__empty-hint">尝试调整年代或路线分类。</p>
        </div>
      )}
    </section>
  );
}
