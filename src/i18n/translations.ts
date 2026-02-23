// ============================================
// Translation Dictionary — EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
  'home.intro': { en: 'This is Kun. Before knowing more about me, I wanna say:', zh: '我是昆。在了解更多之前，我想说：' },
  'home.lastUpdated': { en: 'Last updated', zh: '最近更新' },
  'home.professional': { en: 'Enter Chaguan', zh: '进入茶馆' },
  'home.lifeJourney': { en: 'Life Journey', zh: '人生旅途' },

  // --- Greeting (time-aware) ---
  'greeting.morning': { en: 'Good morning,', zh: '早上好哇,' },
  'greeting.afternoon': { en: 'Good afternoon,', zh: '下午好哇,' },
  'greeting.evening': { en: 'Good evening,', zh: '晚上好哇,' },
  'greeting.body': {
    en: 'and in case I don\u2019t see you, good afternoon, good evening, and good night!',
    zh: '假如很难再次遇见你，祝你早安、午安、晚安。',
  },
  'greeting.source': { en: '\u2014 The Truman Show', zh: '\u2014\u2014《楚门的世界》' },

  // --- Late night message (0:00–3:59) ---
  // Lead rendered with innerHTML to include cat images; body uses \n\n as paragraph separator
  'lateNight.lead': {
    en: 'Late Night Message from',
    zh: '来自',
  },
  'lateNight.leadSuffix': {
    en: '',
    zh: ' 的深夜消息',
  },
  'lateNight.body': {
    en: 'Lucky (cat food quality inspector) and Happy (curtain\u2011to\u2011mop\u2011cloth magician) here.\n\nStill awake? Anything bothering you?\n\nKun (our poop\u2011scooper) often gets scolded by his mommy for staying up late.\n\nShe actually just worries about him, though.\n\nWishing you happiness every day, and FALL INTO SLEEP soon!',
    zh: 'Lucky（猫罐头质检员）和 Happy（窗帘变拖把布魔术大师）在此。\n\n还没睡？有什么烦心事吗？\n\nKun（我们的铲屎官）经常因为熬夜而挨他妈妈的骂。\n\n其实她只是担心他。\n\n祝你每天快乐，赶快入睡！',
  },

  // --- Navigation ---
  'nav.back': { en: '\u2190 Back', zh: '\u2190 返回' },
  'nav.backToProfessional': { en: '\u2190 Back to Professional', zh: '\u2190 返回职业' },

  // --- Professional page titles ---
  'professional.productMarketing': { en: 'Product Marketing', zh: '产品营销' },
  'professional.dataScience': { en: 'Data Science', zh: '数据科学' },
  'professional.visualDesign': { en: 'Visual Design', zh: '视觉设计' },
  'professional.quantInsights': { en: 'Quant Insights & Measurement', zh: '量化洞察与评估' },
  'professional.brandNarrative': { en: 'Brand & Narrative Design', zh: '品牌与叙事设计' },
  'professional.informationDesign': { en: 'Information Design', zh: '信息设计' },

  // --- Professional page subtitles ---
  'professional.quantSubtitle': {
    en: 'Product Marketing \u00D7 Data Science',
    zh: '产品营销 \u00D7 数据科学',
  },
  'professional.brandSubtitle': {
    en: 'Product Marketing \u00D7 Visual Design',
    zh: '产品营销 \u00D7 视觉设计',
  },
  'professional.infoSubtitle': {
    en: 'Data Science \u00D7 Visual Design',
    zh: '数据科学 \u00D7 视觉设计',
  },

  // --- Common ---
  'common.comingSoon': { en: 'Content coming soon...', zh: '内容即将上线…' },

  // --- Bubble labels ---
  'bubble.pm': { en: 'Product Marketing', zh: '产品营销' },
  'bubble.ds': { en: 'Data Science', zh: '数据科学' },
  'bubble.visual': { en: 'Visual Design', zh: '视觉设计' },

  // --- Bartender dialog ---
  'bar.greeting': { en: 'What can I get for you today?', zh: '今天想来点什么？' },
  'bar.drink.pm': { en: 'Product Marketing', zh: '产品营销' },
  'bar.drink.ds': { en: 'Data Science', zh: '数据科学' },
  'bar.drink.visual': { en: 'Visual Design', zh: '视觉设计' },
  'bar.drink.pm.desc': { en: 'Product Marketing — smooth, persuasive, and dangerously drinkable.', zh: '产品营销 — 丝滑、有说服力、让人一杯接一杯停不下来。' },
  'bar.drink.ds.desc': { en: 'Data Science — 95% confidence this one slaps.', zh: '数据科学 — 有 95% 的置信度认为这杯超好喝。' },
  'bar.drink.visual.desc': { en: 'Visual Design — looks so good you almost forget to drink it.', zh: '视觉设计 — 好看到让你差点忘了喝。' },

  // --- Bartender mixing dialog ---
  'bar.select.prompt': { en: 'Pick another drink to mix! Or click again for this one.', zh: '再选一杯来调配吧！或者再次点击同一杯。' },
  'bar.mix.pm_ds.desc': { en: 'PM + DS — a cocktail of strategy and numbers!', zh: 'PM + DS — 一杯策略与数据的鸡尾酒！' },
  'bar.mix.pm_visual.desc': { en: 'PM + Visual — where stories meet aesthetics!', zh: 'PM + Visual — 故事与美学的邂逅！' },
  'bar.mix.ds_visual.desc': { en: 'DS + Visual — data, but make it beautiful!', zh: 'DS + Visual — 让数据变得好看！' },

  // --- Bar mix card ---
  'bar.card.cta': { en: 'Taste this blend \u2192', zh: '品尝这杯特调 \u2192' },
  'bar.card.dismiss': { en: 'Maybe later', zh: '下次再说' },

  // --- Bar shelf ---
  'bar.shelf.title': { en: 'Behind the bar', zh: '吧台后面' },

  // --- Bottle skill categories (shelf labels + popup descriptions) ---
  'bar.bottle.strategy':      { en: 'Strategy',     zh: '策略' },
  'bar.bottle.strategy.desc': { en: 'CRM platforms and go-to-market tools', zh: 'CRM平台与市场推广工具' },
  'bar.bottle.analytics':     { en: 'Analytics',    zh: '分析' },
  'bar.bottle.analytics.desc':{ en: 'Measurement, tracking, and experimentation', zh: '数据度量、追踪与实验' },
  'bar.bottle.coding':        { en: 'Coding',       zh: '编程' },
  'bar.bottle.coding.desc':   { en: 'Languages and frameworks for data work', zh: '数据工作的语言和框架' },
  'bar.bottle.ml':            { en: 'ML & Viz',     zh: '机器学习' },
  'bar.bottle.ml.desc':       { en: 'Machine learning and data visualization', zh: '机器学习与数据可视化' },
  'bar.bottle.design':        { en: 'Design',       zh: '设计' },
  'bar.bottle.design.desc':   { en: 'UI/UX design and creative tools', zh: 'UI/UX设计与创意工具' },
  'bar.bottle.3d':            { en: '3D & Web',     zh: '3D & 网页' },
  'bar.bottle.3d.desc':       { en: '3D modeling and interactive web graphics', zh: '3D建模与交互式网页图形' },

  // --- Bartender notes (random, one per visit) ---
  'bar.note.1': {
    en: 'The best cocktails, like the best campaigns, start with knowing your audience.',
    zh: '最好的鸡尾酒，就像最好的营销，都从了解你的受众开始。',
  },
  'bar.note.2': {
    en: 'House rule: we don\'t do pie charts here. Not even for dessert.',
    zh: '店规：这里不做饼图。甜点也不行。',
  },
  'bar.note.3': {
    en: 'Kun once spent 3 hours adjusting a gradient. The client said "looks the same." It was not the same.',
    zh: 'Kun 曾花了 3 小时调一个渐变色。甲方说"看起来一样啊。"并不一样。',
  },
  'bar.note.4': {
    en: 'Side effects of mixing data science with design may include career confusion.',
    zh: '将数据科学和设计混在一起的副作用：职业方向困惑。',
  },
  'bar.note.5': {
    en: 'A p-value can\'t tell you if your landing page is ugly.',
    zh: 'p 值没法告诉你落地页好不好看。',
  },
  'bar.note.6': {
    en: 'This bar doesn\'t have a happy hour. Just happy accidents.',
    zh: '本店没有欢乐时光，只有快乐的意外。',
  },

  // --- Globe pin titles ---
  'pin.jiaozhou.title': { en: 'Where it all began', zh: '一切开始的地方' },
  'pin.qingdao.title': { en: 'Coastal memories', zh: '海边的记忆' },
  'pin.weifang.title': { en: 'Kite city', zh: '风筝之城' },
  'pin.hongkong.title': { en: 'East meets West', zh: '东西交汇' },
  'pin.bangkok.title': { en: 'City of angels', zh: '天使之城' },
  'pin.dubai.title': { en: 'Desert mirage', zh: '沙漠海市蜃楼' },
  'pin.chicago.title': { en: 'The Windy City', zh: '风城' },
  'pin.madison.title': { en: 'Between the lakes', zh: '湖间小城' },
  'pin.fairfield.title': { en: 'Golden state chapter', zh: '金州篇章' },
  'pin.benicia.title': { en: 'By the strait', zh: '海峡之畔' },
  'pin.berkeley.title': { en: 'Ideas in bloom', zh: '思想之花' },
  'pin.kohler.title': { en: 'A village of craft', zh: '匠心小镇' },

  // --- Globe pin stories (placeholder) ---
  'pin.jiaozhou.story': {
    en: 'Placeholder story about Jiaozhou. The roots of a journey, quietly planted in this corner of Shandong.',
    zh: '关于胶州的故事。旅途的根，在山东这个角落悄然扎下。',
  },
  'pin.qingdao.story': {
    en: 'Placeholder story about Qingdao. Sea breeze, red roofs, and the taste of salt in the air.',
    zh: '关于青岛的故事。海风、红瓦屋顶，空气中弥漫着咸味。',
  },
  'pin.weifang.story': {
    en: 'Placeholder story about Weifang. A city where the sky is always full of color.',
    zh: '关于潍坊的故事。一座天空永远五彩斑斓的城市。',
  },
  'pin.hongkong.story': {
    en: 'Placeholder story about Hong Kong. Neon-lit streets, dim sum mornings, and a skyline that never sleeps.',
    zh: '关于香港的故事。霓虹灯下的街道、早茶的清晨，以及永不沉睡的天际线。',
  },
  'pin.bangkok.story': {
    en: 'Placeholder story about Bangkok. Golden temples, bustling markets, and the warmth of Thai hospitality.',
    zh: '关于曼谷的故事。金色的寺庙、热闹的市场，以及泰国人的热情好客。',
  },
  'pin.dubai.story': {
    en: 'Placeholder story about Dubai. A city rising from the sand, where ambition touches the clouds.',
    zh: '关于迪拜的故事。一座从沙漠中崛起的城市，雄心壮志触及云端。',
  },
  'pin.chicago.story': {
    en: 'Placeholder story about Chicago. Deep-dish pizza, jazz, and the wind off Lake Michigan.',
    zh: '关于芝加哥的故事。深盘披萨、爵士乐，以及密歇根湖畔的风。',
  },
  'pin.madison.story': {
    en: 'Placeholder story about Madison. A city cradled between two lakes, full of ideas and energy.',
    zh: '关于麦迪逊的故事。一座依偎在两个湖泊之间的城市，充满思想与活力。',
  },
  'pin.fairfield.story': {
    en: 'Placeholder story about Fairfield. Where the Central Valley meets the coastal hills.',
    zh: '关于费尔菲尔德的故事。中央谷地与海岸丘陵在此交汇。',
  },
  'pin.benicia.story': {
    en: 'Placeholder story about Benicia. A small waterfront town with big character.',
    zh: '关于贝尼西亚的故事。一座个性鲜明的海滨小镇。',
  },
  'pin.berkeley.story': {
    en: 'Placeholder story about Berkeley. Where free thinking and the Bay breeze go hand in hand.',
    zh: '关于伯克利的故事。自由思想与海湾微风相伴而行。',
  },
  'pin.kohler.story': {
    en: 'Placeholder story about Kohler. A small village with an outsized legacy of craft and design.',
    zh: '关于科勒的故事。一座拥有卓越工艺与设计传承的小镇。',
  },

  // --- Language toggle button ---
  'lang.toggle': { en: '中', zh: 'EN' },
};
