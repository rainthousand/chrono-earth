/**
 * Chrono Earth 的历史弧线。
 *
 * `period` 为弧线活跃的大致年份区间；公元前年份使用负数。
 * 路线表达历史联系，不代表对现代国界或精确行程的复原。
 */
export type PlaceId =
  | "giza-pyramids"
  | "stonehenge"
  | "acropolis-of-athens"
  | "colosseum"
  | "pompeii"
  | "petra"
  | "hagia-sophia"
  | "great-wall"
  | "forbidden-city"
  | "mogao-caves"
  | "angkor-wat"
  | "taj-mahal"
  | "notre-dame-paris"
  | "dome-of-the-rock"
  | "machu-picchu"
  | "chichen-itza"
  | "moai-rapa-nui"
  | "bamiyan-buddhas"
  | "alhambra"
  | "lalibela";

export type HistoryRouteCategory =
  | "trade"
  | "migration"
  | "pilgrimage"
  | "conquest"
  | "sailing"
  | "knowledge";

export interface HistoryRoute {
  id: string;
  from: PlaceId;
  to: PlaceId;
  label: string;
  period: readonly [startYear: number, endYear: number];
  category: HistoryRouteCategory;
}

export const historyRoutes: readonly HistoryRoute[] = [
  {
    id: "silk-road-western-corridor",
    from: "petra",
    to: "bamiyan-buddhas",
    label: "丝绸之路西段商旅",
    period: [-100, 700],
    category: "trade",
  },
  {
    id: "silk-road-eastern-corridor",
    from: "bamiyan-buddhas",
    to: "mogao-caves",
    label: "丝绸之路东段商旅",
    period: [100, 900],
    category: "trade",
  },
  {
    id: "buddhist-art-eastward",
    from: "bamiyan-buddhas",
    to: "mogao-caves",
    label: "佛教艺术向东传播",
    period: [200, 800],
    category: "knowledge",
  },
  {
    id: "xuanzang-pilgrimage",
    from: "mogao-caves",
    to: "taj-mahal",
    label: "玄奘西行求法之路",
    period: [629, 645],
    category: "pilgrimage",
  },
  {
    id: "indian-ocean-spice-route",
    from: "angkor-wat",
    to: "taj-mahal",
    label: "印度洋季风贸易",
    period: [900, 1500],
    category: "sailing",
  },
  {
    id: "zheng-he-voyages",
    from: "forbidden-city",
    to: "angkor-wat",
    label: "郑和船队的南海航路",
    period: [1405, 1433],
    category: "sailing",
  },
  {
    id: "qin-northern-frontier",
    from: "forbidden-city",
    to: "great-wall",
    label: "北方王朝的边防迁徙",
    period: [-221, -206],
    category: "migration",
  },
  {
    id: "ming-capital-frontier",
    from: "forbidden-city",
    to: "great-wall",
    label: "明代京师与蓟镇防线",
    period: [1420, 1644],
    category: "conquest",
  },
  {
    id: "roman-aegean-expansion",
    from: "colosseum",
    to: "acropolis-of-athens",
    label: "罗马向爱琴海扩张",
    period: [-146, 330],
    category: "conquest",
  },
  {
    id: "roman-mediterranean-grain",
    from: "giza-pyramids",
    to: "colosseum",
    label: "埃及粮船驶向罗马",
    period: [-30, 395],
    category: "trade",
  },
  {
    id: "bay-of-naples-road",
    from: "colosseum",
    to: "pompeii",
    label: "阿庇亚大道与坎帕尼亚",
    period: [-80, 79],
    category: "migration",
  },
  {
    id: "first-crusade",
    from: "notre-dame-paris",
    to: "dome-of-the-rock",
    label: "十字军东征",
    period: [1096, 1291],
    category: "conquest",
  },
  {
    id: "jerusalem-pilgrimage",
    from: "lalibela",
    to: "dome-of-the-rock",
    label: "埃塞俄比亚朝圣者之路",
    period: [1200, 1600],
    category: "pilgrimage",
  },
  {
    id: "levant-caravan-pilgrimage",
    from: "petra",
    to: "dome-of-the-rock",
    label: "黎凡特山地朝圣商道",
    period: [700, 1500],
    category: "pilgrimage",
  },
  {
    id: "andalusian-knowledge-transfer",
    from: "acropolis-of-athens",
    to: "alhambra",
    label: "希腊典籍的西传",
    period: [800, 1200],
    category: "knowledge",
  },
  {
    id: "reconquista-granada",
    from: "notre-dame-paris",
    to: "alhambra",
    label: "西欧骑士南下伊比利亚",
    period: [1085, 1492],
    category: "conquest",
  },
  {
    id: "spanish-atlantic-conquest",
    from: "alhambra",
    to: "chichen-itza",
    label: "西班牙船队横渡大西洋",
    period: [1517, 1546],
    category: "sailing",
  },
  {
    id: "mughal-southward-migration",
    from: "bamiyan-buddhas",
    to: "taj-mahal",
    label: "莫卧儿王朝南下印度",
    period: [1526, 1658],
    category: "migration",
  },
];

export default historyRoutes;
