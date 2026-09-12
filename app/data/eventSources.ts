export interface EventSource {
  placeId: string;
  year: number;
  title: string;
  publisher: string;
  url: string;
  confidence: "high" | "medium";
  note: string;
}

const UNESCO_PUBLISHER = "UNESCO World Heritage Centre";

function unescoSource(
  placeId: string,
  year: number,
  title: string,
  listId: number,
  confidence: EventSource["confidence"],
  note: string,
): EventSource {
  return {
    placeId,
    year,
    title,
    publisher: UNESCO_PUBLISHER,
    url: `https://whc.unesco.org/en/list/${listId}/`,
    confidence,
    note,
  };
}

function officialSource(
  placeId: string,
  year: number,
  title: string,
  publisher: string,
  url: string,
  confidence: EventSource["confidence"],
  note: string,
): EventSource {
  return { placeId, year, title, publisher, url, confidence, note };
}

/**
 * 事件级来源索引。
 *
 * `medium` 表示权威页面支持事件的主要年代范围或历史语境，但不应被理解为
 * 对数据中近似年份的逐日断代。键固定为 `${placeId}:${year}`，便于时间轴直接查询。
 */
export const eventSources: Readonly<Record<string, readonly EventSource[]>> = {
  "stonehenge:-3000": [
    unescoSource(
      "stonehenge",
      -3000,
      "Stonehenge, Avebury and Associated Sites",
      373,
      "medium",
      "UNESCO 将遗产景观的连续营建置于约公元前3700至1600年；数据年份代表早期工程的近似节点。",
    ),
  ],
  "acropolis-of-athens:-447": [
    unescoSource(
      "acropolis-of-athens",
      -447,
      "Acropolis, Athens",
      404,
      "high",
      "用于核验伯里克利时代卫城重建及帕特农神庙的古典时期年代。",
    ),
  ],
  "pompeii:79": [
    unescoSource(
      "pompeii",
      79,
      "Archaeological Areas of Pompei, Herculaneum and Torre Annunziata",
      829,
      "high",
      "UNESCO 条目明确将城市掩埋与公元79年维苏威火山喷发相联系。",
    ),
  ],
  "hagia-sophia:537": [
    unescoSource(
      "hagia-sophia",
      537,
      "Historic Areas of Istanbul",
      356,
      "high",
      "用于核验查士丁尼时期圣索菲亚大教堂落成及其拜占庭建筑背景。",
    ),
  ],
  "great-wall:-214": [
    unescoSource(
      "great-wall",
      -214,
      "The Great Wall",
      438,
      "medium",
      "条目支持秦统一后连接和扩展既有防御工程的历史语境；年份是项目中的代表节点。",
    ),
  ],
  "forbidden-city:1420": [
    unescoSource(
      "forbidden-city",
      1420,
      "Imperial Palaces of the Ming and Qing Dynasties",
      439,
      "high",
      "用于核验北京紫禁城于明代早期建成并成为皇宫的基本年代。",
    ),
  ],
  "mogao-caves:366": [
    unescoSource(
      "mogao-caves",
      366,
      "Mogao Caves",
      440,
      "high",
      "UNESCO 条目将莫高窟最初营建追溯至公元366年。",
    ),
  ],
  "angkor-wat:1150": [
    unescoSource(
      "angkor-wat",
      1150,
      "Angkor",
      668,
      "medium",
      "用于核验吴哥窟在十二世纪上半叶的营建背景；1150年是完成阶段的近似表达。",
    ),
  ],
  "taj-mahal:1632": [
    unescoSource(
      "taj-mahal",
      1632,
      "Taj Mahal",
      252,
      "high",
      "UNESCO 条目明确记载泰姬陵主体工程于1632年开始。",
    ),
  ],
  "notre-dame-paris:2019": [
    unescoSource(
      "notre-dame-paris",
      2019,
      "Paris, Banks of the Seine",
      600,
      "medium",
      "条目用于核验圣母院属于塞纳河岸遗产范围；火灾细节应结合专项保护档案继续核对。",
    ),
  ],
  "machu-picchu:1450": [
    unescoSource(
      "machu-picchu",
      1450,
      "Historic Sanctuary of Machu Picchu",
      274,
      "medium",
      "UNESCO 将遗址置于印加文明鼎盛时期；1450年是项目采用的近似营建节点。",
    ),
  ],
  "bamiyan-buddhas:2001": [
    unescoSource(
      "bamiyan-buddhas",
      2001,
      "Cultural Landscape and Archaeological Remains of the Bamiyan Valley",
      208,
      "high",
      "用于核验两尊大型佛像于2001年被毁及遗址进入紧急保护语境。",
    ),
  ],
  "alhambra:1492": [
    unescoSource(
      "alhambra",
      1492,
      "Alhambra, Generalife and Albayzín, Granada",
      314,
      "high",
      "用于核验1492年格拉纳达政权更替及宫殿后续基督教王室使用背景。",
    ),
  ],
  "lalibela:1200": [
    unescoSource(
      "lalibela",
      1200,
      "Rock-Hewn Churches, Lalibela",
      18,
      "medium",
      "条目支持教堂群约在十三世纪前后形成；1200年是数据中的概括性节点。",
    ),
  ],
  "carthage:-146": [
    unescoSource(
      "carthage",
      -146,
      "Archaeological Site of Carthage",
      37,
      "high",
      "用于核验第三次布匿战争结束、古迦太基毁坏及随后罗马城市层累。",
    ),
  ],
  "aksum:330": [
    unescoSource(
      "aksum",
      330,
      "Aksum",
      15,
      "medium",
      "条目支持埃扎纳时期王国转向基督教的历史背景；具体年份采用约数。",
    ),
  ],
  "timbuktu:1325": [
    unescoSource(
      "timbuktu",
      1325,
      "Timbuktu",
      119,
      "medium",
      "UNESCO 主要支持城市在马里帝国及其后成为贸易与学术中心，1325年是代表性节点。",
    ),
  ],
  "great-zimbabwe:1300": [
    unescoSource(
      "great-zimbabwe",
      1300,
      "Great Zimbabwe National Monument",
      364,
      "medium",
      "条目将主要繁盛期置于十一至十五世纪，1300年用于表示中期高峰而非精确断代。",
    ),
  ],
  "kilwa-kisiwani:1300": [
    unescoSource(
      "kilwa-kisiwani",
      1300,
      "Ruins of Kilwa Kisiwani and Ruins of Songo Mnara",
      144,
      "medium",
      "用于核验基尔瓦在中世纪印度洋贸易中的繁荣；年份为阶段性近似值。",
    ),
  ],
  "meroe:-300": [
    unescoSource(
      "meroe",
      -300,
      "Archaeological Sites of the Island of Meroe",
      1336,
      "medium",
      "条目支持库施政治中心与王室墓葬向麦罗埃地区集中的长期过程。",
    ),
  ],
  "djenne:1907": [
    unescoSource(
      "djenne",
      1907,
      "Old Towns of Djenné",
      116,
      "high",
      "用于核验现存杰内大清真寺在二十世纪初重建及其持续维护传统。",
    ),
  ],
  "hadrians-wall:122": [
    unescoSource(
      "hadrians-wall",
      122,
      "Frontiers of the Roman Empire",
      430,
      "high",
      "UNESCO 条目明确将哈德良长城开建与公元122年及哈德良的命令相联系。",
    ),
  ],
  "mont-saint-michel:966": [
    unescoSource(
      "mont-saint-michel",
      966,
      "Mont-Saint-Michel and its Bay",
      80,
      "high",
      "用于核验本笃会修士在十世纪进驻及修道院建筑长期发展的起点。",
    ),
  ],
  "chartres-cathedral:1194": [
    unescoSource(
      "chartres-cathedral",
      1194,
      "Chartres Cathedral",
      81,
      "high",
      "用于核验1194年火灾后现存哥特式主体的大规模重建。",
    ),
  ],
  "persepolis:-330": [
    unescoSource(
      "persepolis",
      -330,
      "Persepolis",
      114,
      "high",
      "用于核验亚历山大军队攻占波斯波利斯及宫殿群遭焚毁的历史节点。",
    ),
  ],
  "babylon:-575": [
    unescoSource(
      "babylon",
      -575,
      "Babylon",
      278,
      "medium",
      "条目支持尼布甲尼撒二世时期新巴比伦都城的宏大建设；年份为伊什塔尔门的约定节点。",
    ),
  ],
  "bagan:1044": [
    unescoSource(
      "bagan",
      1044,
      "Bagan",
      1588,
      "high",
      "用于核验阿奴律陀统治开端及十一至十三世纪寺塔营建高峰的历史框架。",
    ),
  ],
  "hampi:1565": [
    unescoSource(
      "hampi",
      1565,
      "Group of Monuments at Hampi",
      241,
      "high",
      "用于核验塔利科塔战役后亨比遭洗劫并迅速失去都城地位。",
    ),
  ],
  "sanchi:-250": [
    unescoSource(
      "sanchi",
      -250,
      "Buddhist Monuments at Sanchi",
      524,
      "medium",
      "条目将最早佛塔与阿育王时期相联系；公元前250年是项目采用的近似节点。",
    ),
  ],
  "potala-palace:1645": [
    unescoSource(
      "potala-palace",
      1645,
      "Historic Ensemble of the Potala Palace, Lhasa",
      707,
      "high",
      "用于核验五世达赖时期现存布达拉宫主体开始建设。",
    ),
  ],
  "teotihuacan:200": [
    unescoSource(
      "teotihuacan",
      200,
      "Pre-Hispanic City of Teotihuacan",
      414,
      "medium",
      "条目支持城市在公元最初数世纪快速发展，200年表示扩张期而非单一事件日。",
    ),
  ],
  "tikal:695": [
    unescoSource(
      "tikal",
      695,
      "Tikal National Park",
      64,
      "medium",
      "用于核验蒂卡尔古典时期王朝与纪念建筑背景；战争节点仍应结合铭文学研究。",
    ),
  ],
  "palenque:683": [
    unescoSource(
      "palenque",
      683,
      "Pre-Hispanic City and National Park of Palenque",
      411,
      "high",
      "用于核验帕卡尔王陵、铭文神庙及七世纪末的王朝年代。",
    ),
  ],
  "mesa-verde:1200": [
    unescoSource(
      "mesa-verde",
      1200,
      "Mesa Verde National Park",
      27,
      "medium",
      "条目支持十二至十三世纪大型崖居聚落的发展，1200年为阶段性节点。",
    ),
  ],
  "cahokia:1050": [
    unescoSource(
      "cahokia",
      1050,
      "Cahokia Mounds State Historic Site",
      198,
      "medium",
      "条目支持十一世纪后城市规模和公共土墩迅速增长，年份为近似转折点。",
    ),
  ],
  "lanse-aux-meadows:1000": [
    unescoSource(
      "lanse-aux-meadows",
      1000,
      "L’Anse aux Meadows National Historic Site",
      4,
      "medium",
      "UNESCO 将诺斯人草皮建筑与约十一世纪初的跨大西洋航行相联系。",
    ),
  ],
  "cusco:1438": [
    unescoSource(
      "cusco",
      1438,
      "City of Cuzco",
      273,
      "medium",
      "条目支持帕查库特克时期都城重塑与帝国扩张，1438年为传统王朝编年节点。",
    ),
  ],
  "nazca-lines:500": [
    unescoSource(
      "nazca-lines",
      500,
      "Lines and Geoglyphs of Nasca and Palpa",
      700,
      "medium",
      "条目支持地画跨越数世纪形成；500年表示主要营造期的晚段而非精确终止年。",
    ),
  ],
  "delphi:-582": [
    unescoSource(
      "delphi",
      -582,
      "Archaeological Site of Delphi",
      393,
      "medium",
      "UNESCO 将德尔斐描述为泛希腊宗教中心，并记录皮提亚竞技会的公共文化传统；公元前582年采用传统制度化年代。",
    ),
  ],
  "prague-castle:1344": [
    unescoSource(
      "prague-castle",
      1344,
      "Historic Centre of Prague",
      616,
      "medium",
      "条目将圣维特主教座堂与布拉格城堡的哥特建筑发展相联系；1344年为项目采用的奠基节点。",
    ),
  ],
  "avignon-palace:1342": [
    unescoSource(
      "avignon-palace",
      1342,
      "Historic Centre of Avignon",
      228,
      "medium",
      "UNESCO 支持教皇宫在十四世纪教廷时期持续营建的历史语境；1342年代表克雷芒六世扩建阶段的起点。",
    ),
  ],
  "buda-castle:1686": [
    unescoSource(
      "buda-castle",
      1686,
      "Budapest, including the Banks of the Danube, the Buda Castle Quarter and Andrássy Avenue",
      400,
      "medium",
      "条目支持布达城堡区在奥斯曼时期及其后重建的历史层累；1686年围城细节采用通行历史编年。",
    ),
  ],
  "samarkand-registan:1417": [
    unescoSource(
      "samarkand-registan",
      1417,
      "Samarkand – Crossroad of Cultures",
      603,
      "medium",
      "UNESCO 将雷吉斯坦与兀鲁伯时代的城市和教育建筑联系起来；1417年为经学院工程的传统开工年份。",
    ),
  ],
  "borobudur:825": [
    unescoSource(
      "borobudur",
      825,
      "Borobudur Temple Compounds",
      592,
      "medium",
      "条目将婆罗浮屠营建置于八至九世纪；825年表示建筑群大致完成的近似节点。",
    ),
  ],
  "nara-todai-ji:752": [
    unescoSource(
      "nara-todai-ji",
      752,
      "Historic Monuments of Ancient Nara",
      870,
      "medium",
      "UNESCO 将东大寺及其大佛置于八世纪奈良都城的佛教文化背景；开眼供养年份采用传统编年。",
    ),
  ],
  "gyeongju:676": [
    unescoSource(
      "gyeongju",
      676,
      "Gyeongju Historic Areas",
      976,
      "medium",
      "条目支持庆州作为新罗长期都城及统一时期文化中心的语境；676年是项目采用的时代分界点。",
    ),
  ],
  "old-havana:1561": [
    unescoSource(
      "old-havana",
      1561,
      "Old Havana and its Fortification System",
      204,
      "medium",
      "UNESCO 支持哈瓦那因战略港口与跨大西洋航运而形成防御城市；1561年船队节点采用历史编年。",
    ),
  ],
  "tiwanaku:700": [
    unescoSource(
      "tiwanaku",
      700,
      "Tiwanaku: Spiritual and Political Centre of the Tiwanaku Culture",
      567,
      "medium",
      "条目将蒂瓦纳库影响扩展置于约公元500至900年的鼎盛阶段；700年为区间中的代表节点。",
    ),
  ],
  "chan-chan:1470": [
    unescoSource(
      "chan-chan",
      1470,
      "Chan Chan Archaeological Zone",
      366,
      "medium",
      "UNESCO 记录奇穆王国最终被印加征服的历史结局；1470年为项目采用的近似并入年份。",
    ),
  ],
  "cartagena-walled-city:1741": [
    unescoSource(
      "cartagena-walled-city",
      1741,
      "Port, Fortresses and Group of Monuments, Cartagena",
      285,
      "medium",
      "条目支持卡塔赫纳作为加勒比战略港口及其庞大防御体系的背景；1741年围城采用历史编年。",
    ),
  ],
  "ouro-preto:1789": [
    unescoSource(
      "ouro-preto",
      1789,
      "Historic Town of Ouro Preto",
      124,
      "medium",
      "UNESCO 将城市与十八世纪淘金繁荣及巴西独立运动早期思想联系起来；1789年用于标记米纳斯密谋。",
    ),
  ],
  "nan-madol:1200": [
    unescoSource(
      "nan-madol",
      1200,
      "Nan Madol: Ceremonial Centre of Eastern Micronesia",
      1503,
      "medium",
      "条目支持潟湖人工岛和巨石建筑约在十二至十三世纪集中发展；1200年为概括性节点。",
    ),
  ],
  "kakadu:-18000": [
    unescoSource(
      "kakadu",
      -18000,
      "Kakadu National Park",
      147,
      "medium",
      "UNESCO 记录该地延续数万年的人类活动与岩画传统；公元前18000年是项目采用的近似早期节点。",
    ),
  ],
  "royal-tombs-of-buganda:1884": [
    unescoSource(
      "royal-tombs-of-buganda",
      1884,
      "Tombs of Buganda Kings at Kasubi",
      1022,
      "high",
      "UNESCO 条目将卡苏比从穆特萨一世的宫殿转为其1884年去世后的王室墓地。",
    ),
  ],
  "sukhothai:1279": [
    unescoSource(
      "sukhothai",
      1279,
      "Historic Town of Sukhothai and Associated Historic Towns",
      574,
      "medium",
      "条目支持素可泰在十三至十四世纪成为早期泰国王国中心；1279年为兰甘亨统治的传统起点。",
    ),
  ],
  "ayutthaya:1767": [
    unescoSource(
      "ayutthaya",
      1767,
      "Historic City of Ayutthaya",
      576,
      "high",
      "UNESCO 明确记录阿瑜陀耶于1767年遭缅甸军队攻击并被夷毁，城市随后不再重建于原址。",
    ),
  ],
  "ellora-caves:760": [
    unescoSource(
      "ellora-caves",
      760,
      "Ellora Caves",
      243,
      "medium",
      "条目支持凯拉萨神庙属于八世纪大型独石开凿工程；760年为营建起点的近似表达。",
    ),
  ],
  "samarra:836": [
    unescoSource(
      "samarra",
      836,
      "Samarra Archaeological City",
      276,
      "high",
      "UNESCO 条目记载萨迈拉自836年起成为阿拔斯王朝首都，并保存大规模规划遗迹。",
    ),
  ],
  "valletta:1566": [
    unescoSource(
      "valletta",
      1566,
      "City of Valletta",
      131,
      "high",
      "UNESCO 条目将瓦莱塔奠基追溯至1566年，并与圣约翰骑士团及大围攻后的设防规划相联系。",
    ),
  ],
  "moenjodaro:-2500": [
    unescoSource(
      "moenjodaro",
      -2500,
      "Archaeological Ruins at Moenjodaro",
      138,
      "medium",
      "条目支持摩亨佐-达罗在公元前第三千纪形成规划城市、街道与排水系统；年份为成熟期近似节点。",
    ),
  ],
  "volubilis:40": [
    unescoSource(
      "volubilis",
      40,
      "Archaeological Site of Volubilis",
      836,
      "high",
      "UNESCO 条目记载沃吕比利斯在公元40年被罗马吞并，随后成为毛里塔尼亚廷吉塔纳的重要城市。",
    ),
  ],
  "rapa-nui-orongo:1867": [
    unescoSource(
      "rapa-nui-orongo",
      1867,
      "Rapa Nui National Park",
      715,
      "medium",
      "UNESCO 支持奥龙戈礼仪村与鸟人信仰传统的历史语境；1867年仅作为仪式衰落阶段的近似节点。",
    ),
  ],
  "leptis-magna:193": [
    unescoSource(
      "leptis-magna",
      193,
      "Archaeological Site of Leptis Magna",
      183,
      "high",
      "UNESCO 将城市的宏伟扩建与出生于此、193年即位的塞普蒂米乌斯·塞维鲁明确相联系。",
    ),
  ],
  "kairouan:670": [
    unescoSource(
      "kairouan",
      670,
      "Kairouan",
      499,
      "high",
      "UNESCO 条目明确记载凯鲁万于670年建立，随后成为马格里布重要宗教城市。",
    ),
  ],
  "abomey-palaces:1892": [
    unescoSource(
      "abomey-palaces",
      1892,
      "Royal Palaces of Abomey",
      323,
      "high",
      "UNESCO 记载贝汉津在1892年抵抗法军时焚毁阿波美，部分宫殿建筑得以幸存。",
    ),
  ],
  "robben-island:1964": [
    unescoSource(
      "robben-island",
      1964,
      "Robben Island",
      916,
      "medium",
      "条目支持罗本岛作为种族隔离时期政治犯监狱及曼德拉长期囚禁地的历史；具体入岛年份采用审判编年。",
    ),
  ],
  "mapungubwe:1220": [
    unescoSource(
      "mapungubwe",
      1220,
      "Mapungubwe Cultural Landscape",
      1099,
      "medium",
      "UNESCO 支持马蓬古布韦在十三世纪发展为南部非洲重要王国及贸易中心；1220年为形成阶段近似节点。",
    ),
  ],
  "bryggen:1360": [
    unescoSource(
      "bryggen",
      1360,
      "Bryggen",
      59,
      "high",
      "UNESCO 条目记载汉萨同盟于约1360年在卑尔根建立商馆，控制鳕鱼等贸易。",
    ),
  ],
  "dubrovnik-old-city:1667": [
    unescoSource(
      "dubrovnik-old-city",
      1667,
      "Old City of Dubrovnik",
      95,
      "high",
      "UNESCO 条目明确记录1667年地震严重破坏杜布罗夫尼克，幸存建筑与后续重建共同塑造古城。",
    ),
  ],
  "meteora:1356": [
    unescoSource(
      "meteora",
      1356,
      "Meteora",
      455,
      "medium",
      "UNESCO 将迈泰奥拉修道共同体的发展置于十四世纪；1356年为大迈泰奥拉修道院建立的传统节点。",
    ),
  ],
  "tallinn-old-town:1285": [
    unescoSource(
      "tallinn-old-town",
      1285,
      "Historic Centre (Old Town) of Tallinn",
      822,
      "medium",
      "条目支持塔林作为汉萨贸易体系重要城市的长期发展；1285年是项目采用的加入网络节点。",
    ),
  ],
  "rila-monastery:1834": [
    unescoSource(
      "rila-monastery",
      1834,
      "Rila Monastery",
      216,
      "high",
      "UNESCO 条目记录修道院在十九世纪初火灾后于1834至1862年间重建，形成现存主体面貌。",
    ),
  ],
  "sigiriya:477": [
    unescoSource(
      "sigiriya",
      477,
      "Ancient City of Sigiriya",
      202,
      "medium",
      "UNESCO 支持迦叶波一世在五世纪于巨岩营建都城、宫殿与防御体系；477年为迁都的传统编年节点。",
    ),
  ],
  "sydney-opera-house:1973": [
    unescoSource(
      "sydney-opera-house",
      1973,
      "Sydney Opera House",
      166,
      "high",
      "用于核验歌剧院于1973年正式启用及其二十世纪建筑史背景。",
    ),
  ],
  "giza-pyramids:-2560": [
    unescoSource(
      "giza-pyramids",
      -2560,
      "Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur",
      86,
      "medium",
      "UNESCO 页面支持吉萨金字塔群属于古王国时期孟菲斯墓地体系；公元前2560年是胡夫金字塔落成的近似编年节点，并非精确日断。",
    ),
  ],
  "giza-pyramids:1798": [
    unescoSource(
      "giza-pyramids",
      1798,
      "Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur",
      86,
      "medium",
      "UNESCO 页面用于支持遗址范围与考古价值背景；1798年法国远征测绘这一具体节点需结合专项档案核验。",
    ),
  ],
  "stonehenge:-2500": [
    unescoSource(
      "stonehenge",
      -2500,
      "Stonehenge, Avebury and Associated Sites",
      373,
      "medium",
      "UNESCO 将遗产景观的连续营建置于约公元前3700至1600年；公元前2500年代表大型砂岩竖立阶段的近似节点。",
    ),
  ],
  "acropolis-of-athens:1687": [
    unescoSource(
      "acropolis-of-athens",
      1687,
      "Acropolis, Athens",
      404,
      "high",
      "UNESCO 条目明确记录帕特农神庙在1687年威尼斯围攻期间遭炮击并严重毁坏。",
    ),
  ],
  "colosseum:80": [
    unescoSource(
      "colosseum",
      80,
      "Historic Centre of Rome",
      91,
      "medium",
      "UNESCO 页面支持斗兽场作为罗马帝国时期纪念建筑的背景；公元80年开幕庆典的具体编年需结合古典文献核验。",
    ),
  ],
  "colosseum:1349": [
    unescoSource(
      "colosseum",
      1349,
      "Historic Centre of Rome",
      91,
      "medium",
      "UNESCO 页面支持斗兽场的长期毁损与城市遗产语境；1349年地震节点需结合罗马地方档案核验。",
    ),
  ],
  "pompeii:1748": [
    unescoSource(
      "pompeii",
      1748,
      "Archaeological Areas of Pompei, Herculaneum and Torre Annunziata",
      829,
      "high",
      "UNESCO 条目将庞贝系统性发掘的开始明确置于十八世纪中叶，支持1748年的发掘节点。",
    ),
  ],
  "petra:-100": [
    unescoSource(
      "petra",
      -100,
      "Petra",
      326,
      "medium",
      "UNESCO 页面支持佩特拉在纳巴泰时期作为商贸与水利城市繁荣；公元前100年为繁盛阶段的近似表达。",
    ),
  ],
  "petra:106": [
    unescoSource(
      "petra",
      106,
      "Petra",
      326,
      "medium",
      "UNESCO 页面支持佩特拉的纳巴泰与罗马历史层累；公元106年并入阿拉伯行省的精确编年需结合罗马史料核验。",
    ),
  ],
  "hagia-sophia:1453": [
    unescoSource(
      "hagia-sophia",
      1453,
      "Historic Areas of Istanbul",
      356,
      "high",
      "UNESCO 条目支持1453年君士坦丁堡政权更替后圣索菲亚改作清真寺的历史节点。",
    ),
  ],
  "hagia-sophia:1935": [
    unescoSource(
      "hagia-sophia",
      1935,
      "Historic Areas of Istanbul",
      356,
      "high",
      "UNESCO 条目支持圣索菲亚于1935年作为博物馆向公众开放的近现代功能变化。",
    ),
  ],
  "great-wall:1568": [
    unescoSource(
      "great-wall",
      1568,
      "The Great Wall",
      438,
      "medium",
      "UNESCO 页面支持明代长城的大规模修筑与完善；1568年代表戚继光主持蓟镇防务工程的编年节点。",
    ),
  ],
  "forbidden-city:1925": [
    unescoSource(
      "forbidden-city",
      1925,
      "Imperial Palaces of the Ming and Qing Dynasties",
      439,
      "medium",
      "UNESCO 页面支持北京故宫从皇宫转为公共遗产的整体历史；1925年故宫博物院成立的日期需结合院史档案核验。",
    ),
  ],
  "mogao-caves:1900": [
    unescoSource(
      "mogao-caves",
      1900,
      "Mogao Caves",
      440,
      "medium",
      "UNESCO 页面支持莫高窟藏经洞及其文献价值背景；1900年发现节点需结合敦煌研究档案核验。",
    ),
  ],
  "angkor-wat:1431": [
    unescoSource(
      "angkor-wat",
      1431,
      "Angkor",
      668,
      "medium",
      "UNESCO 页面支持吴哥作为高棉帝国中心及后续衰落的历史范围；1431年战争节点需结合区域编年史核验。",
    ),
  ],
  "taj-mahal:1653": [
    unescoSource(
      "taj-mahal",
      1653,
      "Taj Mahal",
      252,
      "medium",
      "UNESCO 页面支持泰姬陵十七世纪的整体营建过程；1653年作为建筑群完成节点是概括性编年。",
    ),
  ],
  "notre-dame-paris:1163": [
    unescoSource(
      "notre-dame-paris",
      1163,
      "Paris, Banks of the Seine",
      600,
      "medium",
      "UNESCO 页面支持巴黎圣母院的中世纪城市与建筑背景；1163年奠基为传统编年节点，并非页面提供的精确日断。",
    ),
  ],
  "notre-dame-paris:1804": [
    unescoSource(
      "notre-dame-paris",
      1804,
      "Paris, Banks of the Seine",
      600,
      "medium",
      "UNESCO 页面支持圣母院的国家仪式与城市历史语境；1804年拿破仑加冕细节需结合法国国家档案核验。",
    ),
  ],
  "dome-of-the-rock:691": [
    unescoSource(
      "dome-of-the-rock",
      691,
      "Old City of Jerusalem and its Walls",
      148,
      "medium",
      "UNESCO 页面支持圆顶清真寺作为耶路撒冷古城重要早期伊斯兰建筑；691年是竣工阶段的传统编年。",
    ),
  ],
  "dome-of-the-rock:1099": [
    unescoSource(
      "dome-of-the-rock",
      1099,
      "Old City of Jerusalem and its Walls",
      148,
      "medium",
      "UNESCO 页面支持遗址跨宗教政权的历史语境；1099年十字军占领后的用途变化需结合专项史料核验。",
    ),
  ],
  "machu-picchu:1911": [
    unescoSource(
      "machu-picchu",
      1911,
      "Historic Sanctuary of Machu Picchu",
      274,
      "medium",
      "UNESCO 页面支持马丘比丘进入现代研究与保护视野的背景；1911年考察节点需结合探险与考古档案核验。",
    ),
  ],
  "chichen-itza:900": [
    unescoSource(
      "chichen-itza",
      900,
      "Pre-Hispanic City of Chichen-Itza",
      483,
      "medium",
      "UNESCO 页面支持奇琴伊察在九至十世纪发展为区域中心；900年为阶段性近似节点。",
    ),
  ],
  "chichen-itza:1200": [
    unescoSource(
      "chichen-itza",
      1200,
      "Pre-Hispanic City of Chichen-Itza",
      483,
      "medium",
      "UNESCO 页面支持城市在玛雅—托尔特克文化交流后的长期演变；1200年衰落节点是概括性年代。",
    ),
  ],
  "moai-rapa-nui:1250": [
    unescoSource(
      "moai-rapa-nui",
      1250,
      "Rapa Nui National Park",
      715,
      "medium",
      "UNESCO 页面支持摩艾与祭祀平台在岛屿文化中的长期营造；1250年为主要雕造期的近似节点。",
    ),
  ],
  "moai-rapa-nui:1722": [
    unescoSource(
      "moai-rapa-nui",
      1722,
      "Rapa Nui National Park",
      715,
      "medium",
      "UNESCO 页面支持拉帕努伊与外部世界接触后的历史背景；1722年欧洲船队抵达需结合航海档案核验。",
    ),
  ],
  "bamiyan-buddhas:507": [
    unescoSource(
      "bamiyan-buddhas",
      507,
      "Cultural Landscape and Archaeological Remains of the Bamiyan Valley",
      208,
      "medium",
      "UNESCO 页面支持巴米扬佛像约在五至六世纪开凿；507年为早期巨像形成的近似节点。",
    ),
  ],
  "alhambra:1238": [
    unescoSource(
      "alhambra",
      1238,
      "Alhambra, Generalife and Albayzín, Granada",
      314,
      "medium",
      "UNESCO 页面支持纳斯里王朝时期宫殿城的营建；1238年为穆罕默德一世启动工程的传统编年节点。",
    ),
  ],
  "lalibela:1520": [
    unescoSource(
      "lalibela",
      1520,
      "Rock-Hewn Churches, Lalibela",
      18,
      "medium",
      "UNESCO 页面支持拉利贝拉教堂群长期宗教使用与保护背景；1520年欧洲使团记录需结合旅行文献核验。",
    ),
  ],
  "knossos:-1700": [
    unescoSource(
      "knossos",
      -1700,
      "Minoan Palatial Centres",
      1733,
      "medium",
      "UNESCO 页面支持克诺索斯新宫殿时期的年代范围；公元前1700年为重建阶段的近似节点。",
    ),
  ],
  "waitangi:1840": [
    officialSource(
      "waitangi",
      1840,
      "The Treaty in brief",
      "New Zealand History — Ministry for Culture and Heritage",
      "https://nzhistory.govt.nz/politics/treaty/the-treaty-in-brief",
      "high",
      "新西兰文化与遗产部官方历史页面支持1840年2月6日怀唐伊条约首次签署及双语文本背景。",
    ),
  ],
  "kandy-sacred-city:1592": [
    unescoSource(
      "kandy-sacred-city",
      1592,
      "Sacred City of Kandy",
      450,
      "medium",
      "UNESCO 页面支持佛牙寺与康提王权、信仰中心的历史关系；1592年舍利迁入为传统编年节点。",
    ),
  ],
  "luang-prabang:1353": [
    unescoSource(
      "luang-prabang",
      1353,
      "Town of Luang Prabang",
      479,
      "medium",
      "UNESCO 页面支持琅勃拉邦作为澜沧王国历史首都的背景；1353年建国节点需结合区域编年史核验。",
    ),
  ],
  "hue-monuments:1802": [
    unescoSource(
      "hue-monuments",
      1802,
      "Complex of Hué Monuments",
      678,
      "high",
      "UNESCO 条目明确支持顺化于1802年成为统一越南首都并开始建设皇城的历史节点。",
    ),
  ],
  "pingyao-ancient-city:1823": [
    unescoSource(
      "pingyao-ancient-city",
      1823,
      "Ancient City of Ping Yao",
      812,
      "medium",
      "UNESCO 页面支持平遥在十九世纪成为中国金融中心的背景；1823年日升昌创办节点需结合票号档案核验。",
    ),
  ],
  "kaesong:918": [
    unescoSource(
      "kaesong",
      918,
      "Historic Monuments and Sites in Kaesong",
      1278,
      "high",
      "UNESCO 条目支持开城自918年起作为高丽王朝首都及其政治文化中心的历史。",
    ),
  ],
  "merv:1221": [
    unescoSource(
      "merv",
      1221,
      "State Historical and Cultural Park ‘Ancient Merv’",
      886,
      "medium",
      "UNESCO 页面支持梅尔夫在丝绸之路上的长期兴衰与多城层累；1221年蒙古攻城细节需结合专项史料核验。",
    ),
  ],
  "khiva-itchan-kala:1740": [
    unescoSource(
      "khiva-itchan-kala",
      1740,
      "Itchan Kala",
      543,
      "medium",
      "UNESCO 页面支持希瓦古城作为汗国中心的历史背景；1740年纳迪尔沙占领节点需结合波斯与中亚编年史核验。",
    ),
  ],
  "jerash:106": [
    officialSource(
      "jerash",
      106,
      "The Archaeological City of Jerash (Ancient Gerasa)",
      UNESCO_PUBLISHER,
      "https://whc.unesco.org/en/tentativelists/6563/",
      "medium",
      "UNESCO 预备名录页支持杰拉什的罗马城市及区域背景；106年并入阿拉伯行省的精确节点需结合罗马行政史料核验。",
    ),
  ],
  "chaco-canyon:1050": [
    unescoSource(
      "chaco-canyon",
      1050,
      "Chaco Culture",
      353,
      "medium",
      "UNESCO 页面支持查科峡谷在九至十三世纪作为普韦布洛文化中心；1050年为大型公共建筑扩张期的近似节点。",
    ),
  ],
  "taos-pueblo:1680": [
    unescoSource(
      "taos-pueblo",
      1680,
      "Taos Pueblo",
      492,
      "medium",
      "UNESCO 页面支持陶斯普韦布洛延续至今的原住民文化与殖民接触背景；1680年起义节点需结合殖民档案核验。",
    ),
  ],
  "old-quebec:1608": [
    unescoSource(
      "old-quebec",
      1608,
      "Historic District of Old Québec",
      300,
      "high",
      "UNESCO 条目明确支持魁北克由尚普兰于十七世纪初建立，并发展为设防殖民城市。",
    ),
  ],
  "old-san-juan:1539": [
    unescoSource(
      "old-san-juan",
      1539,
      "La Fortaleza and San Juan National Historic Site in Puerto Rico",
      266,
      "medium",
      "UNESCO 页面支持圣胡安防御体系自十六世纪持续营建；1539年莫罗要塞开工为项目采用的编年节点。",
    ),
  ],
  "copan:738": [
    unescoSource(
      "copan",
      738,
      "Maya Site of Copan",
      129,
      "medium",
      "UNESCO 页面支持科潘王朝、铭文与区域权力背景；738年十八兔王被俘的具体节点需结合铭文研究核验。",
    ),
  ],
  "san-agustin:1": [
    unescoSource(
      "san-agustin",
      1,
      "San Agustín Archaeological Park",
      744,
      "medium",
      "UNESCO 页面支持大型石雕与墓葬在公元前后延续数世纪的营造范围；公元1年是繁盛期的概括性节点。",
    ),
  ],
  "quito-historic-center:1534": [
    unescoSource(
      "quito-historic-center",
      1534,
      "City of Quito",
      2,
      "high",
      "UNESCO 条目明确支持基多于1534年在印加城市基础上由西班牙人建立的历史节点。",
    ),
  ],
  "salvador-da-bahia:1549": [
    unescoSource(
      "salvador-da-bahia",
      1549,
      "Historic Centre of Salvador de Bahia",
      309,
      "high",
      "UNESCO 条目明确支持萨尔瓦多于1549年建立并成为葡萄牙美洲首个首府的历史。",
    ),
  ],
  "jesuit-missions-paraguay:1767": [
    unescoSource(
      "jesuit-missions-paraguay",
      1767,
      "Jesuit Missions of La Santísima Trinidad de Paraná and Jesús de Tavarangue",
      648,
      "medium",
      "UNESCO 页面支持耶稣会传教聚落的殖民与宗教历史；1767年驱逐令影响的具体节点需结合王室档案核验。",
    ),
  ],
  "valparaiso-quarter:1914": [
    unescoSource(
      "valparaiso-quarter",
      1914,
      "Historic Quarter of the Seaport City of Valparaíso",
      959,
      "medium",
      "UNESCO 页面支持瓦尔帕莱索作为跨洋航运港口的繁荣与衰落背景；1914年运河开通造成的转折为历史语境节点。",
    ),
  ],
  "port-arthur-tasmania:1833": [
    unescoSource(
      "port-arthur-tasmania",
      1833,
      "Australian Convict Sites",
      1306,
      "medium",
      "UNESCO 页面支持亚瑟港作为十九世纪澳大利亚流放与强制劳役体系的重要组成；1833年扩建节点需结合殖民档案核验。",
    ),
  ],
  "levuka:1874": [
    unescoSource(
      "levuka",
      1874,
      "Levuka Historical Port Town",
      1399,
      "high",
      "UNESCO 条目支持莱武卡在1874年斐济割让英国及随后殖民行政中心的历史背景。",
    ),
  ],
  "chief-roi-mata-domain:1600": [
    unescoSource(
      "chief-roi-mata-domain",
      1600,
      "Chief Roi Mata’s Domain",
      1280,
      "medium",
      "UNESCO 页面支持罗伊·马塔故事与约四百年前社会改革的考古、景观及口述传统；1600年为概括性节点。",
    ),
  ],
  "bikini-atoll:1946": [
    unescoSource(
      "bikini-atoll",
      1946,
      "Bikini Atoll Nuclear Test Site",
      1339,
      "high",
      "UNESCO 条目明确支持美国于1946年在比基尼环礁开始核试验及居民被迫迁离的历史。",
    ),
  ],
  "brimstone-hill:1782": [
    unescoSource(
      "brimstone-hill",
      1782,
      "Brimstone Hill Fortress National Park",
      910,
      "medium",
      "UNESCO 页面支持要塞在英法殖民战争中的军事历史；1782年法军围攻与投降节点需结合军事档案核验。",
    ),
  ],
};

export function getSourcesForEvent(placeId: string, year: number): readonly EventSource[] {
  return eventSources[`${placeId}:${year}`] ?? [];
}
