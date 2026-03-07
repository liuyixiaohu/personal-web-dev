// ============================================
// Translation Dictionary — EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
  'home.professional': { en: 'Enter Chaguan', zh: '进入茶馆' },
  'home.lifeJourney': { en: 'Life Journey', zh: '人生旅途' },

  // --- Greeting ---
  'greeting.lead': {
    en: 'In case I don\u2019t see ya...',
    zh: '假如很难再次遇见你……',
  },
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
  'bar.drink.pm.desc': { en: 'Nailed the positioning. Then the product pivoted.', zh: '找到一个完美的产品定位！然后产品转型了！' },
  'bar.drink.ds.desc': { en: 'Presented findings to leadership. They went with their gut.', zh: '给上司汇报了分析结果。完事儿他们相信他们的"第六感"。' },
  'bar.drink.visual.desc': { en: 'After spending 3 hours adjusting a gradient. The client said, "looks the same." It was not.', zh: '花三小时调了个渐变。客户说"看起来一样。"那能一样吗？' },

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

  // --- Events page ---
  'home.events': { en: 'Bay Area Events', zh: '湾区活动' },
  'events.title': { en: 'Today\'s New Luma Events at SF Bay Area', zh: '今日新增 Luma 活动（旧金山湾区）' },
  'events.lastUpdated': { en: 'Last checked', zh: '最近检查' },
  'events.noEvents': { en: 'No new events discovered today. Check back tomorrow!', zh: '今天没有发现新活动，明天再来看看吧！' },
  'events.staleWarning': { en: 'Data may be stale — last update was over 48 hours ago.', zh: '数据可能已过时——上次更新超过48小时前。' },
  'events.fetchError': { en: 'Unable to load events right now. Please try again later.', zh: '暂时无法加载活动信息，请稍后再试。' },
  'events.loading': { en: 'Loading events...', zh: '正在加载活动...' },
  'events.free': { en: 'Free', zh: '免费' },
  'events.approval': { en: 'Requires Approval', zh: '需要审批' },
  'events.guests': { en: 'guests', zh: '位参与者' },
  'events.online': { en: 'Online', zh: '线上' },
  'events.hostedBy': { en: 'Hosted by', zh: '主办方' },
  'events.eventCount': { en: 'events found', zh: '个活动' },
  'events.filterLocation': { en: 'Location', zh: '地点' },
  'events.filterPrice': { en: 'Price', zh: '费用' },
  'events.filterAll': { en: 'All', zh: '全部' },
  'events.filterFreeApproval': { en: 'Free (May Require Approval)', zh: '免费（可能需要审批）' },
  'events.filterPaid': { en: 'Paid', zh: '付费' },
  'events.sortBy': { en: 'Sort', zh: '排序' },
  'events.sortAlphaAsc': { en: 'A → Z', zh: 'A → Z' },
  'events.sortAlphaDesc': { en: 'Z → A', zh: 'Z → A' },
  'events.sortTimeAsc': { en: 'Earliest first', zh: '时间最早' },
  'events.sortTimeDesc': { en: 'Latest first', zh: '时间最近' },
  'events.sortGuestsAsc': { en: 'Fewest guests', zh: '参与最少' },
  'events.sortGuestsDesc': { en: 'Most guests', zh: '参与最多' },
  'events.clearFilters': { en: 'Clear filters', zh: '清除筛选' },
  'events.noMatch': { en: 'No events match filters', zh: '没有匹配的活动' },
  'events.guestsNotDisclosed': { en: 'Not disclosed', zh: '未公开' },

  // --- Language toggle button ---
  'lang.toggle': { en: '中', zh: 'EN' },
};
