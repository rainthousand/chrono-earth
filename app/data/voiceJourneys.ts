export interface VoiceJourney {
  id: string;
  title: string;
  englishTitle: string;
  description: string;
  closingLine: string;
  accent: string;
  voiceIds: readonly string[];
}

export const voiceJourneys: readonly VoiceJourney[] = [
  {
    id: "roads-of-the-wanderer",
    title: "远行者的路",
    englishTitle: "ROADS OF THE WANDERER",
    description: "从荷马的海上漂泊，到老子的脚下远行，再抵达但丁人生旅途的中途。",
    closingLine: "每一次远行，既改变远方，也重新定义出发的人。",
    accent: "#D7AD68",
    voiceIds: ["homer-muse", "laozi-journey", "dante-middle", "basho-old-pond"],
  },
  {
    id: "war-memory-ruins",
    title: "战争、记忆与废墟",
    englishTitle: "WAR, MEMORY & RUINS",
    description: "城邦的理想、帝国的史诗、破碎的山河，以及人在无常世界中的自省。",
    closingLine: "废墟没有沉默，它只是把胜利者的语言交还给时间。",
    accent: "#C87858",
    voiceIds: ["pericles-many", "virgil-arms", "du-fu-spring", "aurelius-point"],
  },
  {
    id: "one-world-within",
    title: "一颗星球，万种内心",
    englishTitle: "ONE EARTH, MANY INNER WORLDS",
    description: "从仁与礼、法与慈悲，到斯多葛的宇宙尺度与俳句的一声水响。",
    closingLine: "当世界缩成一个点，人的内心反而成为最辽阔的地理。",
    accent: "#A995D3",
    voiceIds: ["confucius-friends", "ashoka-children", "aurelius-point", "basho-old-pond"],
  },
  {
    id: "moon-over-homelands",
    title: "明月照见故乡",
    englishTitle: "MOON OVER DISTANT HOMELANDS",
    description: "从李白床前的月光，到苏轼遥问青天；让离散、故乡与相隔千里的团圆彼此照亮。",
    closingLine: "故乡未必能够抵达，但人类总能在同一束光里认出彼此。",
    accent: "#D6C28D",
    voiceIds: ["homer-muse", "li-bai-moon", "su-shi-moon", "marti-sincere"],
  },
  {
    id: "freedom-within",
    title: "自由始于内心",
    englishTitle: "FREEDOM BEGINS WITHIN",
    description: "从苏格拉底的省察、爱比克泰德的选择，到泰戈尔无所畏惧的心灵与马蒂真诚的自我。",
    closingLine: "世界划定人的处境，仍无法替一个人完成他内心的选择。",
    accent: "#8FB5A8",
    voiceIds: ["plato-examined-life", "epictetus-control", "aurelius-point", "tagore-without-fear", "marti-sincere"],
  },
  {
    id: "sacred-words",
    title: "神圣之言的回声",
    englishTitle: "ECHOES OF THE SACRED WORD",
    description: "五种古老语言从天空、心念、诵读与芦笛出发，追问人在宇宙中的位置。",
    closingLine: "答案各不相同，而仰望、倾听与追问本身，始终属于同一种人类。",
    accent: "#8D91C7",
    voiceIds: ["psalms-heavens", "rigveda-one-truth", "dhammapada-mind", "quran-read", "rumi-reed"],
  },
  {
    id: "languages-build-worlds",
    title: "语言重新建造世界",
    englishTitle: "LANGUAGES THAT BUILT WORLDS",
    description: "英雄史诗、宫廷物语、骑士幻梦与民主之歌，让旧语言不断发明新的世界。",
    closingLine: "文明会成为遗址，语言却能让已经消失的世界再次开始呼吸。",
    accent: "#C58E72",
    voiceIds: ["beowulf-listen", "ferdowsi-wisdom", "murasaki-radiance", "dante-middle", "cervantes-mancha", "whitman-self"],
  },
  {
    id: "who-owns-the-city",
    title: "共同世界属于谁",
    englishTitle: "WHO OWNS THE COMMON WORLD",
    description: "从仁与礼、雅典城邦和阿育王敕令，走到一份至今仍在被重新解释的现代条约。",
    closingLine: "共同体不是完成的答案，而是一代代人持续争辩、修正与承担的关系。",
    accent: "#C3A65D",
    voiceIds: ["confucius-friends", "pericles-many", "aristotle-political", "ashoka-children", "waitangi-sovereignty"],
  },
];
