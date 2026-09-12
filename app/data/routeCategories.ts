import type { HistoryRouteCategory } from "./historyRoutes";

export interface RouteCategoryMeta {
  id: HistoryRouteCategory;
  label: string;
  englishLabel: string;
  symbol: string;
  description: string;
  accent: string;
}

export const routeCategories: readonly RouteCategoryMeta[] = [
  {
    id: "trade",
    label: "商贸",
    englishLabel: "Trade",
    symbol: "◇",
    description: "货物、工艺与度量体系在城市之间流动。",
    accent: "#D9A65A",
  },
  {
    id: "migration",
    label: "迁徙",
    englishLabel: "Migration",
    symbol: "↝",
    description: "人群跨越气候、地形与旧有边界寻找新的家园。",
    accent: "#C78E6B",
  },
  {
    id: "pilgrimage",
    label: "朝圣",
    englishLabel: "Pilgrimage",
    symbol: "✦",
    description: "信徒沿神圣道路汇聚，携带语言、图像与仪式。",
    accent: "#9E8FD6",
  },
  {
    id: "conquest",
    label: "征服",
    englishLabel: "Conquest",
    symbol: "╱",
    description: "军队与帝国扩张重新划定权力、人口和记忆。",
    accent: "#C96F5B",
  },
  {
    id: "sailing",
    label: "航海",
    englishLabel: "Sailing",
    symbol: "≈",
    description: "季风、海流与远洋技术连接彼此遥远的海岸。",
    accent: "#55B6B2",
  },
  {
    id: "knowledge",
    label: "知识",
    englishLabel: "Knowledge",
    symbol: "⌁",
    description: "典籍、科学、艺术与建造方法沿网络传播。",
    accent: "#5DC5E8",
  },
];

export function getRouteCategoryMeta(category: HistoryRouteCategory) {
  return routeCategories.find(({ id }) => id === category);
}
