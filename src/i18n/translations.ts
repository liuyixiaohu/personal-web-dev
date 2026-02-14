// ============================================
// Translation Dictionary — EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
  'home.intro': { en: 'This is Kun. Before knowing more about me, I wanna say:', zh: '我是昆。在了解更多之前，我想说：' },
  'home.lastUpdated': { en: 'Last updated', zh: '最近更新' },
  'home.professional': { en: 'Professional Architecture', zh: '专业架构' },
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
  // Use \n as line break marker; render with innerHTML after replacing \n → <br>
  'lateNight.lead': {
    en: 'Lucky & Happy\u2019s Late Night Message',
    zh: 'Lucky 和 Happy 的深夜特别消息',
  },
  'lateNight.body': {
    en: 'We are Lucky (cat food quality inspector)\nand Happy (curtain\u2011to\u2011mop\u2011cloth magician).\n\nWhy are you still awake? Is something bothering you?\n\nKun (our poop\u2011scooper) often gets scolded\nby his mom for staying up late (she actually just worries about him).\n\nWishing you good health and happiness every day.\nGo to sleep soon!',
    zh: '我们是 Lucky（猫罐头质检员）\n和 Happy（窗帘变拖把布魔术大师）。\n\n为什么你还醒着，是有什么烦心事吗？\n\nKun（我们的铲屎官）经常因为熬夜\n而挨他妈妈的批评（实际是心疼）。\n\n祝你身体健康，每天快乐。\n赶快入睡！',
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
  'bar.drink.pm.desc': { en: 'A smooth pink blend of strategy and storytelling.', zh: '策略与叙事的丝滑粉色调酒。' },
  'bar.drink.ds.desc': { en: 'A cool blue concoction of numbers and insight.', zh: '数字与洞察的清凉蓝色调酒。' },
  'bar.drink.visual.desc': { en: 'A refreshing green mix of form and feeling.', zh: '形式与感受的清新绿色调酒。' },

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
