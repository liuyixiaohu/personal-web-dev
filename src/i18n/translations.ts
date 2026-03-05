// ============================================
// Translation Dictionary — EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
  'home.lastUpdated': { en: 'Last updated', zh: '最近更新' },
  'home.professional': { en: 'Enter Chaguan', zh: '进入茶馆' },
  'home.lifeJourney': { en: 'Life Journey', zh: '人生旅途' },

  // --- Greeting ---
  'greeting.lead': { en: 'In case I don\u2019t see ya...', zh: '假如很难再次遇见你……' },
  'greeting.body': {
    en: 'good afternoon, good evening, and good night.',
    zh: '祝你早安、午安、晚安。',
  },
  'greeting.source': { en: '\u2014 The Truman Show', zh: '\u2014\u2014《楚门的世界》' },

  // --- Navigation ---
  'nav.back': { en: '\u2190 Back', zh: '\u2190 返回' },
  'nav.backToProfessional': { en: '\u2190 Back to Professional', zh: '\u2190 返回职业' },

  // --- Professional page titles ---
  'professional.productMarketing': { en: 'Product Marketing', zh: '产品营销' },
  'professional.dataScience': { en: 'Data Science', zh: '数据科学' },
  'professional.visualDesign': { en: 'Visual Design', zh: '视觉设计' },
  // --- Common ---
  'common.comingSoon': { en: 'Content coming soon...', zh: '内容即将上线…' },

  // --- Professional page items ---
  'bar.drink.pm': { en: 'Product Marketing', zh: '产品营销' },
  'bar.drink.ds': { en: 'Data Science', zh: '数据科学' },
  'bar.drink.visual': { en: 'Visual Design', zh: '视觉设计' },
  'bar.drink.pm.desc': { en: 'Product Marketing — smooth, persuasive, and dangerously drinkable.', zh: '产品营销 — 丝滑、有说服力、让人一杯接一杯停不下来。' },
  'bar.drink.ds.desc': { en: 'Data Science — 95% confidence this one slaps.', zh: '数据科学 — 有 95% 的置信度认为这杯超好喝。' },
  'bar.drink.visual.desc': { en: 'Visual Design — looks so good you almost forget to drink it.', zh: '视觉设计 — 好看到让你差点忘了喝。' },

  // --- Section headers ---
  'bar.section.notes': { en: 'Notes from the bar', zh: '吧台便条' },

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
