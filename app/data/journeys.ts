import type {
  HistoryRouteCategory,
  PlaceId,
} from "./historyRoutes";

export interface JourneyChapter {
  placeId: PlaceId;
  year: number;
  title: string;
  narration: string;
}

export interface CuratedJourney {
  id: string;
  title: string;
  englishTitle: string;
  summary: string;
  accent: string;
  routeCategory: HistoryRouteCategory;
  stopIds: readonly PlaceId[];
  yearRange: readonly [startYear: number, endYear: number];
  chapters: readonly JourneyChapter[];
}

/**
 * 策展式旅程使用现有历史坐标组成叙事路径。
 *
 * 章节年份是镜头落点，而非对路线起止时间的精确断言；地点在部分章节中
 * 也可作为更大区域的视觉锚点。
 */
export const journeys: readonly CuratedJourney[] = [
  {
    id: "silk-road",
    title: "丝绸之路",
    englishTitle: "Threads of the Silk Road",
    summary:
      "跟随商队与求法者穿越荒漠、山口和绿洲，看丝绸、信仰与图像如何共同塑造欧亚大陆。",
    accent: "#D9A65A",
    routeCategory: "trade",
    stopIds: ["petra", "bamiyan-buddhas", "mogao-caves", "taj-mahal"],
    yearRange: [-100, 900],
    chapters: [
      {
        placeId: "petra",
        year: -100,
        title: "玫瑰之城的商队",
        narration:
          "乳香、香料与织物在佩特拉换手，纳巴泰人的岩石之城成为地中海与东方贸易之间的门廊。",
      },
      {
        placeId: "bamiyan-buddhas",
        year: 550,
        title: "群山中的佛国",
        narration:
          "越过兴都库什山脉，商旅在巴米扬看见巨佛立于崖壁；货物之外，信仰与造像技艺也在向东远行。",
      },
      {
        placeId: "mogao-caves",
        year: 629,
        title: "绿洲保存万千世界",
        narration:
          "敦煌汇聚来自印度、中亚与中原的色彩和故事，洞窟壁画把一条道路上的相遇凝固为永恒星河。",
      },
      {
        placeId: "taj-mahal",
        year: 645,
        title: "抵达印度文明腹地",
        narration:
          "求法者抵达恒河平原。此时泰姬陵尚未出现，但后世的白色穹顶将继续见证波斯、中亚与印度文化的交融。",
      },
    ],
  },
  {
    id: "age-of-sail",
    title: "海洋时代",
    englishTitle: "The Oceanic Age",
    summary:
      "从东方宝船到横渡大西洋的舰队，季风、星象与野心把遥远海岸编织进同一个世界。",
    accent: "#55B6B2",
    routeCategory: "sailing",
    stopIds: [
      "forbidden-city",
      "angkor-wat",
      "alhambra",
      "taj-mahal",
      "chichen-itza",
    ],
    yearRange: [1405, 1546],
    chapters: [
      {
        placeId: "forbidden-city",
        year: 1405,
        title: "宝船奉诏启航",
        narration:
          "明代船队从帝国中枢获得诏令与物资，一场跨越南海和印度洋的宏大航行由此展开。",
      },
      {
        placeId: "angkor-wat",
        year: 1413,
        title: "季风连接南海",
        narration:
          "船队沿季风抵达东南亚港湾，吴哥所在的内陆文明也通过河流与海路进入庞大的区域交换网。",
      },
      {
        placeId: "alhambra",
        year: 1492,
        title: "伊比利亚转向大西洋",
        narration:
          "格拉纳达易手的同一年，另一支船队向西驶入未知海域，王权把目光从半岛投向更辽阔的世界。",
      },
      {
        placeId: "taj-mahal",
        year: 1498,
        title: "印度洋迎来新航线",
        narration:
          "欧洲船只绕过好望角抵达印度，古老的季风贸易体系开始面对来自远洋的新力量。",
      },
      {
        placeId: "chichen-itza",
        year: 1519,
        title: "两个世界剧烈相遇",
        narration:
          "横渡大西洋的船队抵达中美洲，航海所连接的不只有贸易，也带来征服、疾病与文明秩序的断裂。",
      },
    ],
  },
  {
    id: "roads-of-faith",
    title: "朝圣之路",
    englishTitle: "Roads of Faith",
    summary:
      "穿过教堂、沙漠与圣城，追随跨越洲际的信徒，聆听神圣道路如何携带语言、仪式与建筑想象。",
    accent: "#9E8FD6",
    routeCategory: "pilgrimage",
    stopIds: [
      "notre-dame-paris",
      "dome-of-the-rock",
      "petra",
      "lalibela",
    ],
    yearRange: [1096, 1600],
    chapters: [
      {
        placeId: "notre-dame-paris",
        year: 1096,
        title: "从西欧踏上东方之路",
        narration:
          "钟声与布道召集人群离开故乡。虔敬、冒险和战争混杂在一起，朝向耶路撒冷的漫长道路由此开启。",
      },
      {
        placeId: "dome-of-the-rock",
        year: 1099,
        title: "圣城的多重记忆",
        narration:
          "耶路撒冷同时承载多种信仰的神圣叙事；朝圣者抵达的终点，也不断成为冲突与共存的起点。",
      },
      {
        placeId: "petra",
        year: 1187,
        title: "穿越黎凡特山地",
        narration:
          "商旅与朝圣者共享水源、驿站和古老山道，佩特拉周围的通路让神圣旅程与日常贸易彼此交叠。",
      },
      {
        placeId: "lalibela",
        year: 1200,
        title: "岩石中的新耶路撒冷",
        narration:
          "埃塞俄比亚工匠向下凿刻整座教堂，把遥远圣城的想象重塑于高原岩层之中，至今仍迎接朝圣人群。",
      },
    ],
  },
  {
    id: "empires-and-conquest",
    title: "帝国与征服",
    englishTitle: "Empires & Conquest",
    summary:
      "沿权力扩张的弧线进入五座城市，看帝国如何借军队、道路与纪念建筑改写世界，也留下无法抹去的裂痕。",
    accent: "#C96F5B",
    routeCategory: "conquest",
    stopIds: [
      "acropolis-of-athens",
      "colosseum",
      "hagia-sophia",
      "alhambra",
      "chichen-itza",
    ],
    yearRange: [-146, 1546],
    chapters: [
      {
        placeId: "acropolis-of-athens",
        year: -146,
        title: "希腊世界纳入罗马",
        narration:
          "罗马控制希腊城邦，却又被希腊艺术与思想深刻改变；征服者与被征服者开始共同塑造新的帝国文化。",
      },
      {
        placeId: "colosseum",
        year: 80,
        title: "帝国把胜利化为奇观",
        narration:
          "斗兽场的开幕庆典把战争俘获、财富与工程能力集中展示给城市人群，权力由此成为可观看的景观。",
      },
      {
        placeId: "hagia-sophia",
        year: 1453,
        title: "君士坦丁堡陷落",
        narration:
          "城墙被攻破，东罗马帝国终结。圣索菲亚的穹顶见证政权与信仰符号在同一空间完成转换。",
      },
      {
        placeId: "alhambra",
        year: 1492,
        title: "格拉纳达交出钥匙",
        narration:
          "伊比利亚最后的穆斯林王国结束，精美宫墙被新王权接管，而战争塑造的流亡潮仍在继续。",
      },
      {
        placeId: "chichen-itza",
        year: 1546,
        title: "征服越过大西洋",
        narration:
          "西班牙殖民力量控制尤卡坦，玛雅城市的旧秩序在暴力、疾病与文化抵抗中被重新书写。",
      },
    ],
  },
];

export default journeys;
