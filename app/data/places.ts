/**
 * Chrono Earth V1 的精选地点数据。
 *
 * `coordinates` 使用 [经度, 纬度]；公元前年份使用负数表示。
 */
export interface Event {
  year: number;
  title: string;
  summary: string;
}

export interface Place {
  id: string;
  name: string;
  localName: string;
  country: string;
  coordinates: readonly [longitude: number, latitude: number];
  period: readonly [startYear: number, endYear: number];
  category: string;
  summary: string;
  eraLabel: string;
  accent: string;
  events: readonly Event[];
}

export const places: readonly Place[] = [
  {
    id: "giza-pyramids",
    name: "吉萨金字塔群",
    localName: "أهرامات الجيزة",
    country: "埃及",
    coordinates: [31.1342, 29.9792],
    period: [-2580, 2026],
    category: "ancient-wonder",
    summary: "尼罗河西岸的王室墓地，金字塔、神庙与周围墓葬共同记录古埃及古王国的营建与丧葬传统。",
    eraLabel: "古埃及 · 古王国时期",
    accent: "#E6B96A",
    events: [
      {
        year: -2560,
        title: "胡夫金字塔建成（约）",
        summary: "公元前26世纪，胡夫的陵墓在吉萨高原建成，原高约146.5米；今日裸露的石块外曾覆盖精细的石灰岩。确切竣工年份尚不能确定。",
      },
      {
        year: 1798,
        title: "近代测绘展开",
        summary: "法国入侵埃及期间，随军学者展开古迹与地形调查；测绘成果后来汇入《埃及志》，成为研究金字塔等遗址的近代文献。",
      },
    ],
  },
  {
    id: "stonehenge",
    name: "巨石阵",
    localName: "Stonehenge",
    country: "英国",
    coordinates: [-1.8262, 51.1789],
    period: [-3100, 2026],
    category: "prehistoric-site",
    summary: "索尔兹伯里平原上的史前环形遗迹，其营建跨越许多代人，至今仍保留仪式与天象之谜。",
    eraLabel: "史前欧洲 · 新石器时代",
    accent: "#B8C3A5",
    events: [
      {
        year: -3000,
        title: "最早的环形土垒出现",
        summary: "先民挖掘环沟并竖立木柱或石柱，形成遗址最初的空间秩序。",
      },
      {
        year: -2500,
        title: "巨型砂岩被竖立",
        summary: "大型萨森石被运输、加工并组成今日最具辨识度的门形结构。",
      },
    ],
  },
  {
    id: "acropolis-of-athens",
    name: "雅典卫城",
    localName: "Ακρόπολη Αθηνών",
    country: "希腊",
    coordinates: [23.7267, 37.9715],
    period: [-447, 2026],
    category: "classical-civilization",
    summary: "高踞雅典城心的神庙建筑群，以帕特农神庙为核心，凝结了古典城邦的信仰与公共理想。",
    eraLabel: "古希腊 · 古典时期",
    accent: "#D9C7A1",
    events: [
      {
        year: -447,
        title: "帕特农神庙开工",
        summary: "伯里克利时代的雅典启动卫城重建，以神庙群展示城邦的繁荣与自信。",
      },
      {
        year: 1687,
        title: "炮火重创帕特农神庙",
        summary: "威尼斯军队炮击引燃殿内火药，爆炸使保存两千余年的主体严重坍塌。",
      },
    ],
  },
  {
    id: "colosseum",
    name: "罗马斗兽场",
    localName: "Colosseo",
    country: "意大利",
    coordinates: [12.4922, 41.8902],
    period: [72, 2026],
    category: "imperial-monument",
    summary: "罗马帝国中心的巨型圆形剧场，阶梯、拱券与地下空间共同塑造了古代公共娱乐的舞台。",
    eraLabel: "罗马帝国 · 弗拉维王朝",
    accent: "#C98C63",
    events: [
      {
        year: 80,
        title: "斗兽场举行开幕庆典",
        summary: "提图斯为新剧场举办持续多日的竞技与表演，数万观众在分层看台中入席。",
      },
      {
        year: 1349,
        title: "地震造成大规模坍塌",
        summary: "强震摧毁南侧外墙，部分落石随后被取作城市建筑材料。",
      },
    ],
  },
  {
    id: "pompeii",
    name: "庞贝古城",
    localName: "Pompei",
    country: "意大利",
    coordinates: [14.4989, 40.7484],
    period: [-600, 2026],
    category: "lost-city",
    summary: "被维苏威火山掩埋的罗马城市，街巷、商铺、壁画与墙上涂写，留下公元一世纪居民公共与私人生活的线索。",
    eraLabel: "罗马帝国 · 公元一世纪",
    accent: "#D86B45",
    events: [
      {
        year: 79,
        title: "维苏威火山喷发",
        summary: "火山灰与浮石掩埋城市，喷发造成大量人员死亡。被覆盖的住宅、商铺和器物，成为研究罗马城市生活的考古证据。",
      },
      {
        year: 1748,
        title: "波旁王朝启动发掘",
        summary: "在赫库兰尼姆探索约十年后，波旁王朝将发掘推进至庞贝所在的奇维塔丘。后续数代考古工作逐步揭开街区与住宅。",
      },
    ],
  },
  {
    id: "petra",
    name: "佩特拉古城",
    localName: "البتراء",
    country: "约旦",
    coordinates: [35.4444, 30.3285],
    period: [-312, 2026],
    category: "trade-city",
    summary: "纳巴泰人在峡谷与玫瑰色砂岩中开凿的商旅之城，水利系统曾支撑沙漠路网的繁荣节点。",
    eraLabel: "纳巴泰王国 · 商道时代",
    accent: "#D98A72",
    events: [
      {
        year: -100,
        title: "佩特拉进入繁盛期",
        summary: "香料与乳香贸易汇聚于此，岩凿墓室、神庙和引水设施不断扩建。",
      },
      {
        year: 106,
        title: "并入罗马帝国",
        summary: "纳巴泰王国成为阿拉伯行省，城市延续贸易功能并融入罗马道路体系。",
      },
    ],
  },
  {
    id: "hagia-sophia",
    name: "圣索菲亚大教堂",
    localName: "Ayasofya",
    country: "土耳其",
    coordinates: [28.98, 41.0086],
    period: [532, 2026],
    category: "sacred-architecture",
    summary: "横跨帝国与宗教变迁的穹顶建筑，马赛克、书法与巨大空间在同一结构中层层叠合。",
    eraLabel: "拜占庭帝国 · 查士丁尼时代",
    accent: "#C7A45A",
    events: [
      {
        year: 537,
        title: "查士丁尼大教堂落成",
        summary: "巨型中央穹顶覆盖前所未见的开阔空间，成为拜占庭建筑的代表。",
      },
      {
        year: 1453,
        title: "君士坦丁堡陷落",
        summary: "奥斯曼军队进入城市，建筑随后转为清真寺，并逐步增建宣礼塔等设施。",
      },
      {
        year: 1935,
        title: "作为博物馆开放",
        summary: "建筑完成世俗化改造，覆盖已久的部分拜占庭马赛克重新显露。",
      },
    ],
  },
  {
    id: "great-wall",
    name: "长城",
    localName: "万里长城",
    country: "中国",
    coordinates: [116.5704, 40.4319],
    period: [-700, 2026],
    category: "frontier-system",
    summary: "跨越山地、荒漠与草原的防御体系，由不同王朝持续营建，连接关隘、烽燧与边地交通。",
    eraLabel: "中国古代 · 多王朝营建",
    accent: "#D3A34D",
    events: [
      {
        year: -214,
        title: "秦代连接北方城墙",
        summary: "秦统一后整合并扩筑旧有防线，形成跨区域的北方边防工程。",
      },
      {
        year: 1568,
        title: "明代蓟镇防线重修",
        summary: "戚继光主持加固关墙、敌台与烽火体系，塑造今日北京附近长城的主要面貌。",
      },
    ],
  },
  {
    id: "forbidden-city",
    name: "故宫",
    localName: "紫禁城",
    country: "中国",
    coordinates: [116.397, 39.9163],
    period: [1406, 2026],
    category: "royal-complex",
    summary: "北京中轴线上的宫城，以层层门庭、院落和琉璃屋顶构成明清国家礼制的空间中心。",
    eraLabel: "明清中国 · 宫廷时代",
    accent: "#C94B3C",
    events: [
      {
        year: 1420,
        title: "紫禁城基本建成",
        summary: "明成祖迁都北京前完成大规模宫殿工程，宫城成为帝国政治与礼仪中心。",
      },
      {
        year: 1925,
        title: "故宫博物院成立",
        summary: "昔日宫禁向公众开放，皇家收藏与建筑空间开始转化为现代博物馆体系。",
      },
    ],
  },
  {
    id: "mogao-caves",
    name: "敦煌莫高窟",
    localName: "莫高窟",
    country: "中国",
    coordinates: [94.8048, 40.0372],
    period: [366, 2026],
    category: "cultural-crossroads",
    summary: "敦煌绿洲旁的佛教石窟群，壁画中的商旅、农耕与山水，以及多种文字的写本，留下丝绸之路上信仰与日常生活的交汇。",
    eraLabel: "丝绸之路 · 千年石窟",
    accent: "#C77A45",
    events: [
      {
        year: 366,
        title: "莫高窟开凿肇始",
        summary: "相传僧人乐僔在鸣沙山崖开凿首窟，此后营建延续约一千年。",
      },
      {
        year: 1900,
        title: "藏经洞被发现",
        summary: "王圆箓在第16窟甬道发现封闭入口，通向今编号第17窟的藏经洞。洞内保存了大量写本与绘画，后来分散至世界多地收藏。",
      },
    ],
  },
  {
    id: "angkor-wat",
    name: "吴哥窟",
    localName: "អង្គរវត្ត",
    country: "柬埔寨",
    coordinates: [103.867, 13.4125],
    period: [1113, 2026],
    category: "temple-city",
    summary: "被护城河与森林环绕的高棉神庙，以层叠塔山和连续浮雕构筑印度宇宙观的石造模型。",
    eraLabel: "高棉帝国 · 吴哥时代",
    accent: "#9DAD75",
    events: [
      {
        year: 1150,
        title: "吴哥窟主体建成",
        summary: "苏耶跋摩二世时期完成主要工程，神庙最初用于供奉毗湿奴。",
      },
      {
        year: 1431,
        title: "吴哥王都遭受重创",
        summary: "阿瑜陀耶军队攻入吴哥区域，政治中心此后逐渐向南迁移。",
      },
    ],
  },
  {
    id: "taj-mahal",
    name: "泰姬陵",
    localName: "ताज महल",
    country: "印度",
    coordinates: [78.0421, 27.1751],
    period: [1632, 2026],
    category: "mausoleum",
    summary: "亚穆纳河畔的白色大理石陵墓，以严格轴线、花园与精细镶嵌表达莫卧儿时代的纪念美学。",
    eraLabel: "莫卧儿帝国 · 沙贾汗时代",
    accent: "#D9DED6",
    events: [
      {
        year: 1632,
        title: "陵墓工程启动",
        summary: "沙贾汗为纪念妻子慕塔芝·玛哈尔召集工匠，开始营建大型陵园。",
      },
      {
        year: 1653,
        title: "陵园建筑群完成",
        summary: "主体陵墓已于1648年完成；清真寺、迎宾馆、南侧大门与外院等附属工程延续至1653年，逐步构成今日的陵园建筑群。",
      },
    ],
  },
  {
    id: "notre-dame-paris",
    name: "巴黎圣母院",
    localName: "Notre-Dame de Paris",
    country: "法国",
    coordinates: [2.3499, 48.853],
    period: [1163, 2026],
    category: "gothic-cathedral",
    summary: "塞纳河中心岛上的哥特式大教堂，尖拱、飞扶壁和玫瑰窗见证了巴黎近九百年的公共记忆。",
    eraLabel: "中世纪欧洲 · 哥特时代",
    accent: "#7FA6B8",
    events: [
      {
        year: 1163,
        title: "大教堂奠基",
        summary: "新建筑在巴黎主教莫里斯·德叙利推动下开工，工程延续了多个世代。",
      },
      {
        year: 1804,
        title: "拿破仑加冕",
        summary: "拿破仑在教堂内举行加冕仪式，使这里成为法国政治转折的象征性舞台。",
      },
      {
        year: 2019,
        title: "屋顶与尖塔毁于火灾",
        summary: "大火烧毁木构屋架并导致尖塔坍塌，全球随即展开长期修复与保护行动。",
      },
    ],
  },
  {
    id: "dome-of-the-rock",
    name: "圆顶清真寺",
    localName: "قبة الصخرة",
    country: "耶路撒冷",
    coordinates: [35.2354, 31.778],
    period: [691, 2026],
    category: "sacred-architecture",
    summary: "耶路撒冷圣殿山上覆以金色穹顶的八角形圣所，在多重宗教记忆交叠之处形成鲜明地标。",
    eraLabel: "倭马亚王朝 · 七世纪",
    accent: "#E2B84E",
    events: [
      {
        year: 691,
        title: "圆顶圣所建成",
        summary: "倭马亚哈里发阿卜杜勒·马利克主持营建，建筑以中央岩石组织环形空间。",
      },
      {
        year: 1099,
        title: "十字军占领耶路撒冷",
        summary: "建筑一度被改作基督教圣所，直至十二世纪后期重新恢复伊斯兰用途。",
      },
    ],
  },
  {
    id: "machu-picchu",
    name: "马丘比丘",
    localName: "Machu Picchu",
    country: "秘鲁",
    coordinates: [-72.545, -13.1631],
    period: [1450, 2026],
    category: "mountain-city",
    summary: "安第斯山脊上的印加遗址，梯田、石墙与群峰紧密咬合，展现高山环境中的精密营建。",
    eraLabel: "印加帝国 · 十五世纪",
    accent: "#81A36A",
    events: [
      {
        year: 1450,
        title: "山城的十五世纪营建（约）",
        summary: "印加人在山脊上营建石造建筑、梯田与水道，使农业区与居住区顺应陡峭地形展开。1450年为近似节点，遗址的具体用途仍有研究空间。",
      },
      {
        year: 1911,
        title: "遗址进入国际视野",
        summary: "海勒姆·宾厄姆在梅尔乔·阿特亚加等当地居民协助下抵达遗址，后续考察扩大了其国际知名度；这并非当地人首次知道这座山城。",
      },
    ],
  },
  {
    id: "chichen-itza",
    name: "奇琴伊察",
    localName: "Chichén Itzá",
    country: "墨西哥",
    coordinates: [-88.5678, 20.6843],
    period: [600, 2026],
    category: "ceremonial-city",
    summary: "尤卡坦半岛北部的玛雅城市，金字塔、球场与天然井共同映射历法、仪式和区域贸易。",
    eraLabel: "玛雅文明 · 古典期之后",
    accent: "#B6A55C",
    events: [
      {
        year: 900,
        title: "城市进入繁盛阶段",
        summary: "大型公共建筑集中出现，奇琴伊察成为北部玛雅地区的重要政治与商贸中心。",
      },
      {
        year: 1200,
        title: "区域权力中心转移",
        summary: "城市影响力逐渐减弱，但祭祀活动仍延续，遗址没有从地方记忆中消失。",
      },
    ],
  },
  {
    id: "moai-rapa-nui",
    name: "复活节岛摩艾石像",
    localName: "Moai o Rapa Nui",
    country: "智利",
    coordinates: [-109.3497, -27.1127],
    period: [1250, 2026],
    category: "island-culture",
    summary: "拉帕努伊岛民雕刻并搬运的巨型祖先石像，以沉默阵列守望太平洋中孤立的火山岛。",
    eraLabel: "波利尼西亚 · 拉帕努伊文化",
    accent: "#A78C72",
    events: [
      {
        year: 1250,
        title: "摩艾雕造进入高峰",
        summary: "岛民在拉诺拉拉库采石场雕刻石像，并将其运往各氏族的祭祀平台。",
      },
      {
        year: 1722,
        title: "欧洲船队抵达",
        summary: "荷兰航海者在复活节登岛，留下欧洲人对摩艾与岛上社会的早期记录。",
      },
    ],
  },
  {
    id: "bamiyan-buddhas",
    name: "巴米扬石窟",
    localName: "دره بامیان",
    country: "阿富汗",
    coordinates: [67.8254, 34.832],
    period: [507, 2026],
    category: "cultural-crossroads",
    summary: "兴都库什山间的佛教石窟与巨像遗址，曾是商旅、僧侣和多种艺术传统交汇的驿站。",
    eraLabel: "丝绸之路 · 佛教艺术",
    accent: "#BE9167",
    events: [
      {
        year: 507,
        title: "大型佛像开始形成",
        summary: "工匠在砂岩崖壁中开凿立佛与洞窟，并用泥塑和壁画完善表面。",
      },
      {
        year: 2001,
        title: "两尊巨佛被毁",
        summary: "塔利班炸毁崖壁中的大型佛像，空龛此后成为文化遗产损失的醒目标记。",
      },
    ],
  },
  {
    id: "alhambra",
    name: "阿尔罕布拉宫",
    localName: "Alhambra",
    country: "西班牙",
    coordinates: [-3.5881, 37.1761],
    period: [1238, 2026],
    category: "royal-complex",
    summary: "格拉纳达山丘上的宫殿城堡，水渠、庭院与繁密纹饰保存了伊比利亚伊斯兰文明的最后辉光。",
    eraLabel: "纳斯里德王朝 · 安达卢斯",
    accent: "#C56F50",
    events: [
      {
        year: 1238,
        title: "纳斯里德宫城兴建",
        summary: "穆罕默德一世以旧堡为基础扩建王城，逐步形成宫殿、防御与花园系统。",
      },
      {
        year: 1492,
        title: "格拉纳达交接",
        summary: "末代苏丹向天主教双王交出城池，伊比利亚半岛的穆斯林政权至此终结。",
      },
    ],
  },
  {
    id: "lalibela",
    name: "拉利贝拉岩石教堂",
    localName: "ላሊበላ",
    country: "埃塞俄比亚",
    coordinates: [39.0476, 12.0317],
    period: [1181, 2026],
    category: "rock-hewn-sanctuary",
    summary: "从整块火山岩中向下凿出的教堂群，以壕沟、隧道和庭院连接成仍在使用的信仰空间。",
    eraLabel: "扎格维王朝 · 中世纪非洲",
    accent: "#B77B55",
    events: [
      {
        year: 1200,
        title: "岩石教堂群集中营建",
        summary: "扎格维王朝时期的工匠由地表向下凿刻，塑造出彼此连接的独石建筑。",
      },
      {
        year: 1520,
        title: "早期欧洲记述出现",
        summary: "葡萄牙使团成员详细记录教堂群，其规模与工艺令远道而来的访客惊叹。",
      },
    ],
  },
];

export default places;
