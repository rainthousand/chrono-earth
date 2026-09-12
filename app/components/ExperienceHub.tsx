"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { HistoricalVoice } from "../data/historicalVoices";
import { useModalFocus } from "../hooks/useModalFocus";

export type HubAction = "tour" | "observatory" | "archive" | "journeys" | "regions" | "network" | "favorites" | "filters" | "quality" | "offline" | "random";
export type ExperiencePreset = "origins" | "silk-road" | "modern";

interface HubPlace { id: string; name: string; country: string; }
interface ExperienceHubProps {
  places: readonly HubPlace[];
  voices: readonly HistoricalVoice[];
  discoveredVoices: readonly string[];
  visitedPlaces: readonly string[];
  currentYear: number;
  currentPlaceName?: string;
  focusMode: boolean;
  textScale: "normal" | "large";
  highContrast: boolean;
  reducedMotion: boolean;
  onAction: (action: HubAction) => void;
  onSelectPlace: (placeId: string) => void;
  onSelectVoice: (placeId: string, voiceId: string) => void;
  onPlayQueue: (voiceIds: readonly string[]) => void;
  onPreset: (preset: ExperiencePreset) => void;
  onToggleFocus: () => void;
  onTextScale: (value: "normal" | "large") => void;
  onHighContrast: (value: boolean) => void;
  onReducedMotion: (value: boolean) => void;
  onShare: () => void;
  onClose: () => void;
}

const actionItems: readonly { id: HubAction; label: string; description: string; code: string }[] = [
  { id: "tour", label: "三分钟导览", description: "沿五段声音理解时光地球", code: "01" },
  { id: "observatory", label: "文明观测台", description: "星图、对照、收藏与全景演出", code: "02" },
  { id: "archive", label: "原声档案馆", description: "检索三十段可信文明原声", code: "03" },
  { id: "journeys", label: "诗性历史旅程", description: "沿九条策展航线连续穿越", code: "04" },
  { id: "regions", label: "区域导航", description: "按地理文明区域观察地球", code: "05" },
  { id: "network", label: "文明关系", description: "查看人物、作品与思想连接", code: "06" },
  { id: "favorites", label: "地点收藏", description: "回到你保存过的历史坐标", code: "07" },
  { id: "filters", label: "地图筛选", description: "按时代、区域和主题缩小世界", code: "08" },
  { id: "quality", label: "地球画质", description: "自动、精细、均衡与流畅", code: "09" },
  { id: "offline", label: "离线旅程", description: "查看可在本机使用的内容包", code: "10" },
  { id: "random", label: "随机漫游", description: "把下一站交给时间", code: "11" },
];

export default function ExperienceHub(props: ExperienceHubProps) {
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem("chrono-earth:voice-queue");
    if (!raw) return [];
    try {
      const stored = JSON.parse(raw);
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useModalFocus(dialogRef, props.onClose);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => { window.localStorage.setItem("chrono-earth:voice-queue", JSON.stringify(queue)); }, [queue]);

  const normalized = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => {
    if (!normalized) return [];
    const actions = actionItems.filter((item) => `${item.label}${item.description}`.toLocaleLowerCase().includes(normalized)).slice(0, 4).map((item) => ({ type: "action" as const, id: item.id, title: item.label, meta: item.description }));
    const voices = props.voices.filter((voice) => `${voice.author}${voice.work}${voice.text}${voice.translation}`.toLocaleLowerCase().includes(normalized)).slice(0, 6).map((voice) => ({ type: "voice" as const, id: voice.id, placeId: voice.placeId, title: voice.author, meta: `${voice.work} · ${voice.text}` }));
    const places = props.places.filter((place) => `${place.name}${place.country}`.toLocaleLowerCase().includes(normalized)).slice(0, 5).map((place) => ({ type: "place" as const, id: place.id, title: place.name, meta: place.country }));
    return [...actions, ...voices, ...places];
  }, [normalized, props.places, props.voices]);

  const toggleQueue = (id: string) => setQueue((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 8 ? [...items, id] : items);

  return (
    <section ref={dialogRef} className="experience-hub" role="dialog" aria-modal="true" aria-labelledby="experience-hub-title" tabIndex={-1}>
      <button className="experience-hub__backdrop" type="button" onClick={props.onClose} aria-label="关闭探索中心" />
      <div className="experience-hub__panel">
        <header><div><span>ONE DOOR INTO THE WHOLE EARTH</span><h2 id="experience-hub-title">探索中心</h2></div><button type="button" onClick={props.onClose} aria-label="关闭探索中心">×</button></header>
        <label className="experience-hub__command"><span>⌘ K</span><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索地点、人物、原声或功能" /></label>

        {normalized ? <div className="experience-hub__results">
          <p>找到 {matches.length} 个结果</p>
          {matches.map((item) => <button key={`${item.type}:${item.id}`} type="button" onClick={() => { if (item.type === "action") props.onAction(item.id); else if (item.type === "voice") props.onSelectVoice(item.placeId, item.id); else props.onSelectPlace(item.id); }}><i>{item.type === "action" ? "功能" : item.type === "voice" ? "原声" : "地点"}</i><span><strong>{item.title}</strong><small>{item.meta}</small></span><b>→</b></button>)}
          {matches.length === 0 && <div className="experience-hub__none">没有找到匹配内容，试试“杜甫”“罗马”或“旅程”。</div>}
        </div> : <>
          <div className="experience-hub__resume"><span>继续上一次凝望</span><strong>{props.currentPlaceName ?? "全球视野"}</strong><i>{props.currentYear < 0 ? `公元前 ${Math.abs(props.currentYear)}` : `公元 ${props.currentYear}`}</i><button type="button" onClick={props.onClose}>继续探索 →</button></div>
          <div className="experience-hub__primary">{actionItems.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => props.onAction(item.id)}><i>{item.code}</i><strong>{item.label}</strong><span>{item.description}</span><b>进入 →</b></button>)}</div>
          <button className="experience-hub__expand" type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="experience-hub-advanced">
            <span><strong>{expanded ? "收起完整工具" : "展开全部能力"}</strong><small>时代预设、文明队列、地图工具与阅读偏好</small></span><b aria-hidden="true">{expanded ? "−" : "+"}</b>
          </button>
          {expanded && <div className="experience-hub__advanced" id="experience-hub-advanced">
            <div className="experience-hub__section-title"><span>更多能力</span><i /></div>
            <div className="experience-hub__tools">{actionItems.slice(3).map((item) => <button key={item.id} type="button" onClick={() => props.onAction(item.id)}><i>{item.code}</i><span><strong>{item.label}</strong><small>{item.description}</small></span></button>)}</div>

            <div className="experience-hub__section-title"><span>快速时代预设</span><i /></div>
            <div className="experience-hub__presets"><button type="button" onClick={() => props.onPreset("origins")}><strong>文明初声</strong><span>公元前 1200—前 250</span></button><button type="button" onClick={() => props.onPreset("silk-road")}><strong>丝路交汇</strong><span>公元 600—1300</span></button><button type="button" onClick={() => props.onPreset("modern")}><strong>现代世界</strong><span>公元 1500—1910</span></button></div>

            <div className="experience-hub__section-title"><span>我的文明队列</span><i /><em>{queue.length}/8</em></div>
            <div className="experience-hub__queue"><div>{props.voices.slice(0, 12).map((voice) => <button key={voice.id} type="button" className={queue.includes(voice.id) ? "active" : ""} onClick={() => toggleQueue(voice.id)}><i>{queue.includes(voice.id) ? "−" : "+"}</i>{voice.author}</button>)}</div><button type="button" disabled={queue.length === 0} onClick={() => props.onPlayQueue(queue)}>播放队列 →</button></div>

            <div className="experience-hub__footer-grid">
              <article><span>探索足迹</span><strong>{props.discoveredVoices.length}<small>/30 原声</small></strong><strong>{props.visitedPlaces.length}<small>个历史坐标</small></strong><i><b style={{ width: `${Math.min(100, props.discoveredVoices.length / 30 * 100)}%` }} /></i></article>
              <article><span>阅读与体验</span><label><input type="checkbox" checked={props.focusMode} onChange={props.onToggleFocus} />简约模式（推荐）</label><label><input type="checkbox" checked={props.textScale === "large"} onChange={(event) => props.onTextScale(event.target.checked ? "large" : "normal")} />放大文字</label><label><input type="checkbox" checked={props.highContrast} onChange={(event) => props.onHighContrast(event.target.checked)} />增强对比度</label><label><input type="checkbox" checked={props.reducedMotion} onChange={(event) => props.onReducedMotion(event.target.checked)} />减少动态效果</label></article>
            </div>
            <footer><span>所有偏好与进度仅保存在本机</span><button type="button" onClick={props.onShare}>复制当前时空链接</button></footer>
          </div>}
        </>}
      </div>
    </section>
  );
}
