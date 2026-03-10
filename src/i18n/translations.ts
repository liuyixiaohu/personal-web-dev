// ============================================
// Translation Dictionary: EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
  'home.professional': { en: 'Enter Chaguan', zh: '进入茶馆' },
  'home.specialThanks': { en: 'Special Thanks', zh: '特别感谢' },
  'home.lifeJourney': { en: 'Journey', zh: '旅程' },

  // --- Greeting ---
  'greeting.lead': {
    en: 'In case I don\u2019t see ya...',
    zh: '假如很难再次遇见你... ',
  },
  'greeting.body': {
    en: 'good afternoon, good evening, and good night.',
    zh: '祝你早安、午安、晚安。',
  },
  'greeting.source': { en: '\u2014 The Truman Show', zh: '\u2014\u2014《楚门的世界》' },

  // --- Navigation ---
  'nav.back': { en: '\u2190 Back', zh: '\u2190 返回' },
  'nav.backToProfessional': { en: '\u2190 Back to Professional', zh: '\u2190 返回职业' },
  'nav.backToChaguan': { en: '\u2190 Back to Chaguan', zh: '\u2190 返回茶馆' },

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

  // --- Professional section headings ---
  'pro.section.craft': { en: 'Craft', zh: '吃饭的手艺' },
  'pro.section.lab': { en: 'Lab', zh: '摸鱼万岁！' },

  // --- Events page ---
  'home.events': { en: 'Bay Area Tech Events Monitor', zh: '湾区科技活动监测' },
  'home.events.desc': { en: 'No more doomscrolling Luma into an existential crisis.', zh: '再也不用刷 Luma 刷到怀疑人生了。' },
  'home.brand': { en: 'Brand Guidelines', zh: '品牌指南' },
  'events.title': { en: 'Today\'s Newly Added Luma Events in the Bay Area', zh: '今日新增 Luma 活动（旧金山湾区）' },
  'events.subtitlePre': { en: 'Only showing Tech & AI events ', zh: '仅展示每日' },
  'events.subtitleHighlight': { en: 'newly', zh: '新增' },
  'events.subtitlePost': { en: ' added since the last daily check.', zh: '的科技与 AI 相关活动。' },
  'events.whyTitle': { en: 'Why show only newly added events?', zh: '为什么设计为只显示新增活动？' },
  'events.whyPoint1': {
    en: 'This tool\u2019s primary purpose is to surface potentially high-value events as they appear \u2014 so you don\u2019t have to browse through the entire Luma catalog each day just to see what\u2019s new.',
    zh: '该工具的主要目的是在新活动出现时及时呈现潜在的高价值选项，免去每天为了发现新增内容而反复浏览 Luma 完整列表的时间。',
  },
  'events.whyPoint2': {
    en: 'Balance between convenience and long-term availability. The data comes from an undisclosed endpoint. Keeping the feature restrained and differentiated, rather than building a full-featured alternative, helps reduce the risk of the data source being noticed and shut down.',
    zh: '这也是对便利性与长期可用性的平衡。数据来自一个不便公开的接口。保持功能的克制与差异化，而非构建一个全面的替代方案，有助于降低数据源被关注并停用的风险——否则连这种仅查看每日新增的轻量功能也将无法使用。',
  },
  'events.lastUpdated': { en: 'Last checked', zh: '最近检查' },
  'events.refreshNote': { en: '(Refreshes daily ~7 PM PT)', zh: '（每日约晚 7 点太平洋时间刷新）' },
  'events.noEvents': { en: 'No new events discovered today. Check back tomorrow!', zh: '今天没有发现新活动，明天再来看看吧！' },
  'events.staleWarning': { en: 'Data may be stale. Last update was over 48 hours ago.', zh: '数据可能已过时，上次更新超过48小时前。' },
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
  'events.calendar': { en: 'Event Distribution', zh: '活动分布' },
  'events.searchLabel': { en: 'Search Events or Hosts', zh: '搜索活动或主办方' },
  'events.searchPlaceholder': { en: 'e.g. hackathon, google, etc', zh: '如：hackathon、google' },
  'events.clearFilters': { en: 'Clear filters', zh: '清除筛选' },
  'events.noMatch': { en: 'No events match filters', zh: '没有匹配的活动' },
  'events.showMore': { en: 'More', zh: '更多' },
  'events.showLess': { en: 'Less', zh: '收起' },
  'events.guestsNotDisclosed': { en: 'Not Disclosed', zh: '未公开' },

  // --- Brand Guidelines page ---
  'brand.title': { en: 'Brand Guidelines', zh: '品牌规范' },
  'brand.subtitle': {
    en: 'Design Philosophy: Minimal & Warm',
    zh: '设计理念：极简与温暖',
  },
  'brand.principles': { en: 'Design Principles', zh: '设计原则' },
  'brand.principleMinimal': { en: 'Minimal', zh: '极简' },
  'brand.principleMinimalDesc': {
    en: 'Less is more. No decoration for decoration\'s sake.',
    zh: '少即是多。不为装饰而装饰。',
  },
  'brand.principleFast': { en: 'Fast', zh: '轻快' },
  'brand.principleFastDesc': {
    en: 'Static HTML, zero unnecessary JS, CDN fonts.',
    zh: '静态 HTML，零多余 JS，CDN 字体。',
  },
  'brand.principleWarm': { en: 'Warm', zh: '温暖' },
  'brand.principleWarmDesc': {
    en: 'Cream tones, serif fonts, literary voice.',
    zh: '奶油色调、衬线字体、文学气质。',
  },
  'brand.principleBilingual': { en: 'Bilingual', zh: '双语' },
  'brand.principleBilingualDesc': {
    en: 'Every visible text has English and Chinese.',
    zh: '每段可见文字均有中英双语。',
  },
  'brand.colors': { en: 'Color Palette', zh: '配色方案' },
  'brand.colorsCore': { en: 'Core Palette', zh: '核心色板' },
  'brand.colorsAccents': { en: 'Professional Accents', zh: '职业配色' },
  'brand.typography': { en: 'Typography', zh: '字体排印' },
  'brand.typeFonts': { en: 'Font Pairing', zh: '字体搭配' },
  'brand.typeScale': { en: 'Type Scale', zh: '字号阶梯' },
  'brand.typeStyles': { en: 'Type Styles', zh: '字体样式' },
  'brand.typeScaleNote': {
    en: 'Major Third ratio (1.25×), 0.75rem floor. Root font-size is fluid.',
    zh: '大三度比例（1.25×），最小 0.75rem。根字号流式缩放。',
  },
  'brand.spacing': { en: 'Spacing', zh: '间距' },
  'brand.spacingNote': {
    en: 'Fluid scale using clamp(), adapts to viewport width.',
    zh: '使用 clamp() 的流式间距，随视口宽度自适应。',
  },
  'brand.grid': { en: 'Grid System', zh: '网格系统' },
  'brand.gridNote': {
    en: 'Named-line CSS Grid with three content tracks.',
    zh: '具有三条内容轨道的命名线 CSS 网格。',
  },
  'brand.components': { en: 'Components', zh: '组件样式' },
  'brand.usage.bg': { en: 'Page background', zh: '页面背景' },
  'brand.usage.subtleBg': { en: 'Subtle variation', zh: '细微变化' },
  'brand.usage.warmBorder': { en: 'Warm border', zh: '暖色边框' },
  'brand.usage.greenLight': { en: 'Green background', zh: '绿色背景' },
  'brand.usage.greenMid': { en: 'Green accent', zh: '绿色强调' },
  'brand.usage.blueLight': { en: 'Blue background', zh: '蓝色背景' },
  'brand.usage.blueAccent': { en: 'Blue accent', zh: '蓝色强调' },
  'brand.usage.pinkLight': { en: 'Pink background', zh: '粉色背景' },
  'brand.usage.pinkStrong': { en: 'Pink accent', zh: '粉色强调' },
  'brand.usage.textLight': { en: 'Subtle / decorative', zh: '装饰性文字' },
  'brand.usage.textMid': { en: 'Secondary text', zh: '次要文字' },
  'brand.usage.textPrimary': { en: 'Primary text', zh: '主要文字' },

  // --- Feedback ---
  'events.feedback': { en: 'Feedback', zh: '反馈' },
  'events.feedbackTitle': { en: 'Any Suggestion? Pls!!!', zh: '有什么建议吗？求求了！！！' },
  'events.feedbackPlaceholder': { en: 'Bugs, ideas, anything...', zh: '问题、建议、随便说说…' },
  'events.feedbackSend': { en: 'Send', zh: '发送' },
  'events.feedbackSent': { en: 'Thanks! Feedback sent.', zh: '谢谢！反馈已发送。' },
  'events.feedbackError': { en: 'Failed to send. Try again?', zh: '发送失败，再试一次？' },

  // --- Day & Time filters ---
  'events.filterDay': { en: 'Day', zh: '星期' },
  'events.daySun': { en: 'Sun', zh: '日' },
  'events.dayMon': { en: 'Mon', zh: '一' },
  'events.dayTue': { en: 'Tue', zh: '二' },
  'events.dayWed': { en: 'Wed', zh: '三' },
  'events.dayThu': { en: 'Thu', zh: '四' },
  'events.dayFri': { en: 'Fri', zh: '五' },
  'events.daySat': { en: 'Sat', zh: '六' },
  'events.filterTime': { en: 'Time', zh: '时间' },
  'events.timeFrom': { en: 'From', zh: '从' },
  'events.timeTo': { en: 'To', zh: '到' },
  'events.timeAny': { en: 'Any', zh: '不限' },

  // --- Language toggle button ---
  'lang.toggle': { en: '中', zh: 'EN' },
};
