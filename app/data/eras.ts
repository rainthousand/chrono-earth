/**
 * 时间轴的宏观年代分区。
 *
 * 公元前年份使用负数；五个区间均按首尾年份包含处理，
 * 因此使用相邻整数作为边界，避免年份同时落入两个年代。
 */
export interface Era {
  id: string;
  label: string;
  englishLabel: string;
  range: readonly [startYear: number, endYear: number];
  summary: string;
  accent: string;
  glow: string;
  routeNarrative: string;
}

export const eras: readonly Era[] = [
  {
    id: "first-monuments",
    label: "文明初光",
    englishLabel: "First Monuments",
    range: [-3000, -501],
    summary: "河谷、海岸与高原上的聚落扩展为早期国家，文字、礼仪与巨型建筑留下可辨认的文明轮廓。",
    accent: "#D8AD63",
    glow: "rgba(216, 173, 99, 0.38)",
    routeNarrative: "石材、金属与观念沿河流和近岸航路缓慢移动，远方开始进入彼此的世界。",
  },
  {
    id: "classical-crossroads",
    label: "古典交汇",
    englishLabel: "Classical Crossroads",
    range: [-500, 499],
    summary: "欧亚大陆多种帝国与城邦相继兴盛，战争、贸易和使节往来让遥远地区形成更稳定的联系。",
    accent: "#D58B62",
    glow: "rgba(213, 139, 98, 0.4)",
    routeNarrative: "驿道、商队与地中海航线彼此衔接，商品和知识在帝国边界之间流转。",
  },
  {
    id: "faith-and-roads",
    label: "信仰之路",
    englishLabel: "Faith & Roads",
    range: [500, 1499],
    summary: "宗教共同体、区域王朝与商贸城市重塑旧有网络，朝圣者、学者和工匠跨越语言与疆界。",
    accent: "#9E8FD6",
    glow: "rgba(158, 143, 214, 0.42)",
    routeNarrative: "丝绸之路、季风航线与朝圣道路交织，典籍、艺术样式和技术随旅人远行。",
  },
  {
    id: "oceans-and-empires",
    label: "海洋与帝国",
    englishLabel: "Oceans & Empires",
    range: [1500, 1899],
    summary: "远洋航行把各大洲更紧密地连接，也带来征服、殖民、强迫迁徙与规模空前的物种交换。",
    accent: "#55B6B2",
    glow: "rgba(85, 182, 178, 0.4)",
    routeNarrative: "航线越过大洋形成全球贸易网络，但连接的代价与收益在不同人群之间极不均衡。",
  },
  {
    id: "connected-world",
    label: "互联世界",
    englishLabel: "Connected World",
    range: [1900, 2026],
    summary: "工业化、民族国家与数字网络加速全球流动，战争、保护行动和大众旅行共同改变遗产的意义。",
    accent: "#5DC5E8",
    glow: "rgba(93, 197, 232, 0.42)",
    routeNarrative: "铁路、航空与信息网络压缩距离，历史地点从区域记忆逐渐成为全球共同关注的遗产。",
  },
];

export function getEraForYear(year: number): Era | undefined {
  if (!Number.isFinite(year)) {
    return undefined;
  }

  return eras.find(
    ({ range: [startYear, endYear] }) =>
      year >= startYear && year <= endYear,
  );
}

export default eras;
