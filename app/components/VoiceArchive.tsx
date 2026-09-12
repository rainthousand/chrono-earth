"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { historicalVoices, type HistoricalVoice } from "../data/historicalVoices";
import { useModalFocus } from "../hooks/useModalFocus";

interface ArchivePlace {
  id: string;
  name: string;
  country: string;
}

interface VoiceArchiveProps {
  places: readonly ArchivePlace[];
  onSelect: (placeId: string, voiceId: string) => void;
  onClose: () => void;
}

const eraOptions = [
  { id: "all", label: "全部时代" },
  { id: "ancient", label: "古代 · 500年前" },
  { id: "medieval", label: "中古 · 500—1499" },
  { id: "modern", label: "近现代 · 1500后" },
] as const;

const themeLabels = ["全部主题", "远行与故乡", "权力与共同体", "精神与信仰", "战争与记忆", "诗歌与创造", "自由与自我"] as const;

const themeByVoice: Record<string, (typeof themeLabels)[number]> = {
  "confucius-friends": "权力与共同体", "laozi-journey": "远行与故乡",
  "homer-muse": "远行与故乡", "pericles-many": "权力与共同体",
  "virgil-arms": "战争与记忆", "aurelius-point": "自由与自我",
  "du-fu-spring": "战争与记忆", "dante-middle": "远行与故乡",
  "basho-old-pond": "诗歌与创造", "ashoka-children": "权力与共同体",
  "li-bai-moon": "远行与故乡", "su-shi-moon": "远行与故乡",
  "plato-examined-life": "自由与自我", "aristotle-political": "权力与共同体",
  "epictetus-control": "自由与自我", "shakespeare-stage": "诗歌与创造",
  "beowulf-listen": "战争与记忆", "augustine-restless": "精神与信仰",
  "cervantes-mancha": "诗歌与创造", "ferdowsi-wisdom": "战争与记忆",
  "rumi-reed": "精神与信仰", "quran-read": "精神与信仰",
  "psalms-heavens": "精神与信仰", "dhammapada-mind": "精神与信仰",
  "rigveda-one-truth": "精神与信仰", "tagore-without-fear": "自由与自我",
  "murasaki-radiance": "诗歌与创造", "marti-sincere": "自由与自我",
  "waitangi-sovereignty": "权力与共同体", "whitman-self": "自由与自我",
};

const regionCountries: Record<string, readonly string[]> = {
  东亚: ["中国", "日本"],
  南亚: ["印度", "巴基斯坦"],
  西亚: ["伊朗", "以色列", "巴勒斯坦"],
  欧洲: ["希腊", "意大利", "英国", "西班牙"],
  非洲: ["突尼斯"],
  美洲: ["古巴", "美国"],
  大洋洲: ["新西兰"],
};

function regionForCountry(country: string) {
  return Object.entries(regionCountries).find(([, countries]) => countries.includes(country))?.[0] ?? "其他";
}

function eraForYear(year: number) {
  if (year < 500) return "ancient";
  if (year < 1500) return "medieval";
  return "modern";
}

function formatYear(year: number) {
  return year < 0 ? `公元前 ${Math.abs(year)}` : `公元 ${year}`;
}

export default function VoiceArchive({ places, onSelect, onClose }: VoiceArchiveProps) {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState<(typeof eraOptions)[number]["id"]>("all");
  const [region, setRegion] = useState("全部区域");
  const [language, setLanguage] = useState("全部语言");
  const [theme, setTheme] = useState<(typeof themeLabels)[number]>("全部主题");
  const dialogRef = useRef<HTMLElement>(null);

  useModalFocus(dialogRef, onClose);

  const placeMap = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const languages = useMemo(() => [...new Set(historicalVoices.map(({ language: value }) => value))].sort(), []);
  const regions = useMemo(() => [...new Set(historicalVoices.map((voice) => regionForCountry(placeMap.get(voice.placeId)?.country ?? "")))], [placeMap]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return historicalVoices.filter((voice) => {
      const place = placeMap.get(voice.placeId);
      const searchable = `${voice.text} ${voice.translation} ${voice.author} ${voice.work} ${voice.narration} ${place?.name ?? ""}`.toLocaleLowerCase();
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (era === "all" || eraForYear(voice.year) === era)
        && (region === "全部区域" || regionForCountry(place?.country ?? "") === region)
        && (language === "全部语言" || voice.language === language)
        && (theme === "全部主题" || themeByVoice[voice.id] === theme);
    });
  }, [era, language, placeMap, query, region, theme]);

  const resetFilters = () => {
    setQuery(""); setEra("all"); setRegion("全部区域"); setLanguage("全部语言"); setTheme("全部主题");
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <section ref={dialogRef} tabIndex={-1} className="voice-archive" role="dialog" aria-modal="true" aria-labelledby="voice-archive-title">
      <header className="voice-archive__header">
        <div>
          <span>ARCHIVE OF HUMAN VOICES · 1200 BCE—1910 CE</span>
          <h2 id="voice-archive-title">文明原声档案馆</h2>
          <p>三十束从原典中留下的声音。沿时代、语言与思想的经纬，重新进入它们诞生的世界。</p>
        </div>
        <div className="voice-archive__metrics" aria-label="档案统计">
          <span><strong>30</strong>段原声</span><span><strong>22</strong>历史坐标</span><span><strong>{languages.length}</strong>种语言</span>
        </div>
        <button className="voice-archive__close" type="button" onClick={onClose} aria-label="关闭文明原声档案馆">×</button>
      </header>

      <div className="voice-archive__filters">
        <label className="voice-archive__search">
          <span>检索档案</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="人物、作品、原文或地点" data-modal-autofocus />
        </label>
        <fieldset>
          <legend>时代</legend>
          {eraOptions.map((option) => <button key={option.id} type="button" className={era === option.id ? "active" : ""} onClick={() => setEra(option.id)}>{option.label}</button>)}
        </fieldset>
        <label><span>文明区域</span><select value={region} onChange={(event) => setRegion(event.target.value)}><option>全部区域</option>{regions.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>语言</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>全部语言</option>{languages.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>思想主题</span><select value={theme} onChange={(event) => setTheme(event.target.value as (typeof themeLabels)[number])}>{themeLabels.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>

      <div className="voice-archive__resultbar"><span>当前显现 <strong>{results.length}</strong> / 30</span><i aria-hidden="true" /><button type="button" onClick={resetFilters}>清除筛选</button></div>

      <div className="voice-archive__grid" aria-live="polite">
        {results.map((voice: HistoricalVoice, index) => {
          const place = placeMap.get(voice.placeId);
          return (
            <button key={voice.id} type="button" className="voice-archive-card" onClick={() => onSelect(voice.placeId, voice.id)}>
              <span className="voice-archive-card__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="voice-archive-card__meta">{formatYear(voice.year)} · {place?.name} · {voice.language}</span>
              <strong lang={voice.language === "日语" ? "ja" : undefined}>{voice.text}</strong>
              <span className="voice-archive-card__translation">{voice.translation}</span>
              <span className="voice-archive-card__footer"><b>{voice.author}</b><i>{voice.work}</i><em>{themeByVoice[voice.id]}</em></span>
            </button>
          );
        })}
        {results.length === 0 && <div className="voice-archive__empty"><strong>没有声音消失，只是尚未被这组条件照见。</strong><p>尝试减少筛选条件，或检索另一位人物与作品。</p><button type="button" onClick={resetFilters}>重置全部条件</button></div>}
      </div>
    </section>
  );
}
