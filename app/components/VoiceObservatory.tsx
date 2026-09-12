"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { historicalVoices } from "../data/historicalVoices";
import { voiceJourneys } from "../data/voiceJourneys";
import { useModalFocus } from "../hooks/useModalFocus";

type ObservatoryMode = "starmap" | "compare" | "constellation" | "daily" | "performance";

interface ObservatoryPlace {
  id: string;
  name: string;
  country: string;
  coordinates: readonly [number, number];
}

interface VoiceObservatoryProps {
  places: readonly ObservatoryPlace[];
  onSelect: (placeId: string, voiceId: string) => void;
  onClose: () => void;
}

const modes: readonly { id: ObservatoryMode; index: string; label: string; english: string }[] = [
  { id: "starmap", index: "I", label: "原声星图", english: "VOICE STAR MAP" },
  { id: "compare", index: "II", label: "文明对照", english: "CIVILIZATION LENS" },
  { id: "constellation", index: "III", label: "我的星座", english: "MY CONSTELLATION" },
  { id: "daily", index: "IV", label: "今日信号", english: "DAILY SIGNAL" },
  { id: "performance", index: "V", label: "全景演出", english: "PANORAMIC SHOW" },
];
const DAILY_VOICE_INDEX = Math.floor(Date.now() / 86_400_000) % historicalVoices.length;

function formatYear(year: number) { return year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`; }
function pointFor(coordinates: readonly [number, number]) {
  return { x: ((coordinates[0] + 180) / 360) * 100, y: ((90 - coordinates[1]) / 180) * 100 };
}

function SignalMap({ voiceIds, places, activeId, onSelect }: {
  voiceIds: readonly string[]; places: readonly ObservatoryPlace[]; activeId?: string;
  onSelect?: (placeId: string, voiceId: string) => void;
}) {
  const placeMap = new Map(places.map((place) => [place.id, place]));
  const voices = voiceIds.flatMap((id) => {
    const voice = historicalVoices.find((item) => item.id === id);
    const place = voice ? placeMap.get(voice.placeId) : undefined;
    return voice && place ? [{ voice, place, point: pointFor(place.coordinates) }] : [];
  });
  return (
    <div className="signal-map" aria-label="文明原声世界星图">
      <div className="signal-map__grid" aria-hidden="true" />
      {voices.slice(0, -1).map((item, index) => {
        const next = voices[index + 1];
        const dx = next.point.x - item.point.x; const dy = next.point.y - item.point.y;
        const style = { left: `${item.point.x}%`, top: `${item.point.y}%`, width: `${Math.hypot(dx, dy)}%`, transform: `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`, "--line-index": index } as CSSProperties;
        return <i className="signal-map__line" style={style} key={`${item.voice.id}:${next.voice.id}`} />;
      })}
      {voices.map(({ voice, place, point }, index) => (
        <button key={voice.id} type="button" className={`signal-map__point${activeId === voice.id ? " active" : ""}`} style={{ left: `${point.x}%`, top: `${point.y}%`, "--point-index": index } as CSSProperties} onClick={() => onSelect?.(voice.placeId, voice.id)} aria-label={`${place.name}，${voice.author}`}>
          <i /><span>{voice.author}<small>{place.name} · {formatYear(voice.year)}</small></span>
        </button>
      ))}
    </div>
  );
}

export default function VoiceObservatory({ places, onSelect, onClose }: VoiceObservatoryProps) {
  const [mode, setMode] = useState<ObservatoryMode>("starmap");
  const [journeyId, setJourneyId] = useState(voiceJourneys[3]?.id ?? voiceJourneys[0].id);
  const [leftId, setLeftId] = useState(historicalVoices[0].id);
  const [rightId, setRightId] = useState(historicalVoices[20]?.id ?? historicalVoices[1].id);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showIndex, setShowIndex] = useState(0);
  const [showPlaying, setShowPlaying] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useModalFocus(dialogRef, onClose);

  const placeMap = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const journey = voiceJourneys.find(({ id }) => id === journeyId) ?? voiceJourneys[0];
  const left = historicalVoices.find(({ id }) => id === leftId) ?? historicalVoices[0];
  const right = historicalVoices.find(({ id }) => id === rightId) ?? historicalVoices[1];
  const daily = historicalVoices[DAILY_VOICE_INDEX];
  const currentShowVoice = historicalVoices.find(({ id }) => id === journey.voiceIds[showIndex % journey.voiceIds.length]) ?? historicalVoices[0];

  useEffect(() => {
    const saved = window.localStorage.getItem("chrono-earth:voice-constellation");
    if (!saved) return;
    const timer = window.setTimeout(() => {
      try { setFavorites(JSON.parse(saved)); } catch { /* ignore invalid local preference */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("chrono-earth:voice-constellation", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!showPlaying || mode !== "performance") return;
    const timer = window.setInterval(() => setShowIndex((value) => (value + 1) % journey.voiceIds.length), 4200);
    return () => window.clearInterval(timer);
  }, [journey.voiceIds.length, mode, showPlaying]);

  const changeJourney = (id: string) => { setJourneyId(id); setShowIndex(0); };
  const toggleFavorite = (id: string) => setFavorites((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <section ref={dialogRef} tabIndex={-1} className="voice-observatory" role="dialog" aria-modal="true" aria-labelledby="observatory-title">
      <header>
        <div><span>CHRONO EARTH · HUMAN SIGNAL OBSERVATORY</span><h2 id="observatory-title">文明观测台</h2></div>
        <p>让散落在历史中的声音，成为可以连线、对照、收藏与演出的星座。</p>
        <button type="button" onClick={onClose} aria-label="关闭文明观测台">×</button>
      </header>
      <nav aria-label="观测台五个阶段">
        {modes.map((item) => <button key={item.id} className={mode === item.id ? "active" : ""} type="button" onClick={() => setMode(item.id)}><i>{item.index}</i><span>{item.label}<small>{item.english}</small></span></button>)}
      </nav>

      <div className="voice-observatory__stage">
        {mode === "starmap" && <div className="observatory-starmap">
          <div className="observatory-stage-heading"><span>STAGE I · CONNECT THE VOICES</span><h3>让思想在地球上形成航线</h3><select value={journeyId} onChange={(event) => changeJourney(event.target.value)}>{voiceJourneys.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
          <SignalMap voiceIds={journey.voiceIds} places={places} onSelect={onSelect} />
          <footer><strong>{journey.title}</strong><p>{journey.description}</p><span>{journey.voiceIds.length} 个文明坐标</span></footer>
        </div>}

        {mode === "compare" && <div className="observatory-compare">
          <div className="observatory-stage-heading"><span>STAGE II · TWO DISTANT MIRRORS</span><h3>把相隔千年的声音放在同一束光里</h3></div>
          <div className="observatory-compare__selectors"><select value={leftId} onChange={(event) => setLeftId(event.target.value)}>{historicalVoices.map((voice) => <option value={voice.id} key={voice.id}>{voice.author} · {voice.work}</option>)}</select><i>×</i><select value={rightId} onChange={(event) => setRightId(event.target.value)}>{historicalVoices.map((voice) => <option value={voice.id} key={voice.id}>{voice.author} · {voice.work}</option>)}</select></div>
          <div className="observatory-compare__cards">{[left, right].map((voice) => <article key={voice.id}><span>{formatYear(voice.year)} · {placeMap.get(voice.placeId)?.name} · {voice.language}</span><blockquote>{voice.text}</blockquote><p>{voice.translation}</p><div>{voice.narration}</div><footer><strong>{voice.author}</strong><i>{voice.work}</i><button type="button" onClick={() => onSelect(voice.placeId, voice.id)}>进入原声 →</button></footer></article>)}</div>
          <p className="observatory-compare__distance">两段声音相隔 <strong>{Math.abs(left.year - right.year)}</strong> 年 · 共同穿越了 {new Set([...left.entities, ...right.entities].map(({ type }) => type)).size} 种文明关系</p>
        </div>}

        {mode === "constellation" && <div className="observatory-constellation">
          <div className="observatory-stage-heading"><span>STAGE III · REMEMBER WHAT MOVED YOU</span><h3>保存属于你的文明星座</h3><p>收藏只保存在当前设备，不需要登录。</p></div>
          <SignalMap voiceIds={favorites} places={places} onSelect={onSelect} />
          <div className="observatory-constellation__picker">{historicalVoices.map((voice) => <button type="button" key={voice.id} className={favorites.includes(voice.id) ? "active" : ""} onClick={() => toggleFavorite(voice.id)}><i>{favorites.includes(voice.id) ? "★" : "☆"}</i><span>{voice.author}<small>{voice.text}</small></span></button>)}</div>
          <p className="observatory-constellation__count">已点亮 {favorites.length} / 30 束文明原声</p>
        </div>}

        {mode === "daily" && <div className="observatory-daily">
          <div className="observatory-stage-heading"><span>STAGE IV · ONE SIGNAL EACH DAY</span><h3>今日文明信号</h3></div>
          <article><span>{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })} · SIGNAL {String(DAILY_VOICE_INDEX + 1).padStart(2, "0")}</span><blockquote>{daily.text}</blockquote><p>{daily.translation}</p><div>{daily.narration}</div><footer><strong>{daily.author}</strong><i>{daily.work} · {placeMap.get(daily.placeId)?.name}</i><button type="button" onClick={() => onSelect(daily.placeId, daily.id)}>接收这束信号 →</button></footer></article>
        </div>}

        {mode === "performance" && <div className={`observatory-performance${showPlaying ? " playing" : ""}`}>
          <div className="observatory-stage-heading"><span>STAGE V · LET THE EARTH PERFORM</span><h3>全景文明演出</h3><select value={journeyId} onChange={(event) => changeJourney(event.target.value)}>{voiceJourneys.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
          <SignalMap voiceIds={journey.voiceIds} places={places} activeId={currentShowVoice.id} />
          <article key={currentShowVoice.id}><span>CHAPTER {showIndex + 1} / {journey.voiceIds.length} · {formatYear(currentShowVoice.year)}</span><blockquote>{currentShowVoice.text}</blockquote><p>{currentShowVoice.translation}</p><strong>{currentShowVoice.author} · {placeMap.get(currentShowVoice.placeId)?.name}</strong></article>
          <div className="observatory-performance__controls"><button type="button" onClick={() => setShowIndex((value) => (value - 1 + journey.voiceIds.length) % journey.voiceIds.length)}>←</button><button type="button" className="primary" onClick={() => setShowPlaying((value) => !value)}>{showPlaying ? "暂停演出" : "开始演出"}</button><button type="button" onClick={() => setShowIndex((value) => (value + 1) % journey.voiceIds.length)}>→</button><button type="button" onClick={() => onSelect(currentShowVoice.placeId, currentShowVoice.id)}>进入此刻</button></div>
        </div>}
      </div>
    </section>
  );
}
