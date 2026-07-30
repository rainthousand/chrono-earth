"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeScene } from "./components/GlobeScene";
import { places, type Place } from "./data/places";

const MIN_YEAR = -3000;
const MAX_YEAR = 2026;

function formatYear(year: number) {
  return year < 0 ? `公元前 ${Math.abs(year)} 年` : `公元 ${year} 年`;
}

function getVisibleEvent(place: Place, year: number) {
  return [...place.events]
    .sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))
    .at(0);
}

export function ChronoExperience() {
  const [currentYear, setCurrentYear] = useState(1453);
  const [selectedId, setSelectedId] = useState<string | null>("hagia-sophia");
  const [introVisible, setIntroVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [storyChapter, setStoryChapter] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedPlace = useMemo(
    () => places.find((place) => place.id === selectedId) ?? null,
    [selectedId],
  );
  const visibleEvent = selectedPlace
    ? getVisibleEvent(selectedPlace, currentYear)
    : null;

  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setCurrentYear((year) => {
        const next = year + 8;
        return next > MAX_YEAR ? MIN_YEAR : next;
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing]);

  const selectPlace = useCallback((id: string) => {
    setIntroVisible(false);
    setSelectedId(id);
    setStoryOpen(false);
  }, []);

  const randomExplore = () => {
    const candidates = places.filter((place) => place.id !== selectedId);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    if (next) {
      selectPlace(next.id);
      setCurrentYear(next.events[0]?.year ?? currentYear);
    }
  };

  const openStory = () => {
    if (!selectedPlace) return;
    setStoryChapter(0);
    setCurrentYear(selectedPlace.events[0]?.year ?? currentYear);
    setStoryOpen(true);
    setPlaying(false);
  };

  const nextChapter = () => {
    if (!selectedPlace) return;
    const next = Math.min(storyChapter + 1, selectedPlace.events.length - 1);
    setStoryChapter(next);
    setCurrentYear(selectedPlace.events[next]?.year ?? currentYear);
  };

  const previousChapter = () => {
    if (!selectedPlace) return;
    const previous = Math.max(0, storyChapter - 1);
    setStoryChapter(previous);
    setCurrentYear(selectedPlace.events[previous]?.year ?? currentYear);
  };

  return (
    <main className="experience-shell">
      <a className="skip-link" href="#place-panel">
        跳到景点信息
      </a>

      <div className="globe-stage" aria-label="可交互三维地球">
        <GlobeScene
          places={places}
          currentYear={currentYear}
          selectedId={selectedId}
          onSelect={selectPlace}
        />
        <div className="space-haze" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
      </div>

      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => {
            setIntroVisible(false);
            setSelectedId(null);
            setStoryOpen(false);
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
          <button type="button" onClick={randomExplore}>
            随机漫游
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen((value) => !value)}
            aria-expanded={searchOpen}
          >
            搜索
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

      {searchOpen && (
        <div className="search-panel">
          <label htmlFor="place-search">穿越到一个地点</label>
          <input
            ref={searchRef}
            id="place-search"
            list="place-list"
            placeholder="输入景点名称，例如：庞贝"
            onChange={(event) => {
              const value = event.target.value.trim();
              const match = places.find(
                (place) =>
                  place.name === value ||
                  place.localName === value ||
                  place.name.includes(value),
              );
              if (match) {
                selectPlace(match.id);
                setSearchOpen(false);
              }
            }}
          />
          <datalist id="place-list">
            {places.map((place) => (
              <option key={place.id} value={place.name} />
            ))}
          </datalist>
          <button type="button" onClick={() => setSearchOpen(false)}>
            关闭
          </button>
        </div>
      )}

      {introVisible && (
        <section className="intro-overlay" aria-labelledby="intro-title">
          <p className="eyebrow">A LIVING ARCHIVE OF HUMANITY</p>
          <h1 id="intro-title">
            每一片土地
            <span>都曾见证时间</span>
          </h1>
          <p className="intro-copy">
            转动地球，拨动时间。那些消失的城邦、远行的商路与改变世界的瞬间，
            正在星光之下重新苏醒。
          </p>
          <button
            className="enter-button"
            type="button"
            onClick={() => setIntroVisible(false)}
          >
            <span>开始探索</span>
            <b aria-hidden="true">→</b>
          </button>
          <p className="gesture-hint">
            <span aria-hidden="true">↔</span> 拖动地球 · 滚动缩放
          </p>
        </section>
      )}

      {!introVisible && selectedPlace && !storyOpen && (
        <aside className="place-panel" id="place-panel" aria-live="polite">
          <button
            className="panel-close"
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label="关闭景点信息"
          >
            ×
          </button>
          <p className="panel-kicker">
            {selectedPlace.country} · {selectedPlace.eraLabel}
          </p>
          <h2>{selectedPlace.name}</h2>
          {selectedPlace.localName && (
            <p className="local-name">{selectedPlace.localName}</p>
          )}
          <div className="event-year">
            <span>{formatYear(visibleEvent?.year ?? currentYear)}</span>
            <i />
          </div>
          <h3>{visibleEvent?.title}</h3>
          <p className="place-summary">
            {visibleEvent?.summary ?? selectedPlace.summary}
          </p>
          <div className="event-dots" aria-label="相关事件">
            {selectedPlace.events.map((event) => (
              <button
                key={`${selectedPlace.id}-${event.year}`}
                className={
                  event.year === visibleEvent?.year ? "event-dot active" : "event-dot"
                }
                type="button"
                onClick={() => setCurrentYear(event.year)}
                aria-label={`${formatYear(event.year)}：${event.title}`}
              />
            ))}
          </div>
          <button className="story-button" type="button" onClick={openStory}>
            进入历史现场
            <span aria-hidden="true">↗</span>
          </button>
        </aside>
      )}

      {!introVisible && !storyOpen && (
        <section className="timeline-shell" aria-label="世界历史时间轴">
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
              onChange={(event) => {
                setPlaying(false);
                setCurrentYear(Number(event.target.value));
              }}
              aria-label="选择历史年份"
            />
            <div className="era-labels" aria-hidden="true">
              <span>古代文明</span>
              <span>古典时代</span>
              <span>中世纪</span>
              <span>近现代</span>
              <span>今天</span>
            </div>
          </div>
          <div className="timeline-count">
            <strong>{places.length}</strong>
            <span>历史坐标</span>
          </div>
        </section>
      )}

      {storyOpen && selectedPlace && (
        <section className="story-mode" aria-modal="true" role="dialog">
          <button
            className="story-exit"
            type="button"
            onClick={() => setStoryOpen(false)}
          >
            ← 返回地球
          </button>
          <div className="story-index">
            {String(storyChapter + 1).padStart(2, "0")} /{" "}
            {String(selectedPlace.events.length).padStart(2, "0")}
          </div>
          <div className="story-copy">
            <p>{formatYear(selectedPlace.events[storyChapter].year)}</p>
            <h2>{selectedPlace.events[storyChapter].title}</h2>
            <blockquote>
              {selectedPlace.events[storyChapter].summary}
            </blockquote>
          </div>
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
                  ? () => setStoryOpen(false)
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
          LAT 31.7683° N · LNG 35.2137° E · ARCHIVE 01
        </p>
      )}
    </main>
  );
}
