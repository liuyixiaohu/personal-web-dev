// ============================================
// Translation Dictionary: EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
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
  'nav.back': { en: '\u2190 Home', zh: '\u2190 首页' },

  // --- Life Journey ---
  'journey.hint': { en: 'Click a pin to read the story', zh: '点击图钉查看故事' },

  // --- Craft (professional areas) ---
  'craft.pm': { en: 'Product Marketing', zh: '产品营销' },
  'craft.pm.title': { en: 'Product Marketing', zh: '产品营销' },
  'craft.pm.desc': { en: 'Nailed the positioning. Then the product pivoted.', zh: '找到一个完美的产品定位！然后产品转型了！' },
  'craft.ds': { en: 'Data Science', zh: '数据科学' },
  'craft.ds.title': { en: 'Data Science', zh: '数据科学' },
  'craft.ds.desc': { en: 'Presented findings to leadership. They went with their gut.', zh: '给上司汇报了分析结果。完事儿他们相信他们的"第六感"。' },
  'craft.visual': { en: 'Visual Design', zh: '视觉设计' },
  'craft.visual.title': { en: 'Visual Design', zh: '视觉设计' },
  'craft.visual.desc': { en: 'After spending 3 hours adjusting a gradient. The client said, "looks the same." It was not.', zh: '花三小时调了个渐变。客户说"看起来一样。"那能一样吗？' },

  // --- Common ---
  'common.comingSoon': { en: 'Content coming soon...', zh: '内容即将上线…' },

  // --- Globe pin titles ---
  'pin.jiaozhou.title': { en: 'Where this wonderfully absurd life began', zh: '奇妙人生开始的地方' },
  'pin.qingdao.title': { en: 'Qingdao & Tsingtao', zh: '青岛与青岛啤酒' },
  'pin.shouguang.title': { en: 'Hometown of Chinese Vegetables', zh: '中国蔬菜之乡' },
  'pin.madison.title': { en: 'Between the lakes', zh: '湖间小城' },
  'pin.fairfield.title': { en: 'Golden state chapter', zh: '金州篇章' },
  'pin.berkeley.title': { en: 'Ideas in bloom', zh: '思想之花' },

  // --- Globe pin stories (placeholder) ---
  'pin.jiaozhou.story': {
    en: 'One day in the last century, a person who was bad at English and absolutely terrible at math, even through high school, yet somehow ended up working as a Data Scientist in the USA was born.\nThat\'s me.\n<a href="https://baike.baidu.com/en/item/Jiaozhou%20City/997960" target="_blank" rel="noopener">Jiaozhou</a> is my real hometown, a place famously known for not being known... Which is why, if someone asks me where I\'m from, I always say Qingdao. (Technically, Jiaozhou is part of Qingdao. So it\'s not entirely a lie.)',
    zh: '上世纪某一天，一个不怎么擅长英语、数学也有些烂，结果最终跑到一个说英文的国家做数据科学的我诞生了。<a href="https://baike.baidu.com/en/item/Jiaozhou%20City/997960" target="_blank" rel="noopener">胶州</a>是我真正的家乡，尽管有 5000 年的历史，但是很少有人听说过，所以有人问我是哪里人的时候，我总是说青岛的。（好在胶州确实属于青岛，所以也不全错。）',
  },
  'pin.qingdao.story': {
    en: '"I\'m from a seaside city known for beer and tourism, but I don\'t drink, don\'t like seafood, and don\'t know how to swim" is one of my classic ice breakers.\nThe most famous thing about <a href="https://baike.baidu.com/en/item/Qingdao%20City/985933" target="_blank" rel="noopener">Qingdao</a> is probably Tsingtao Beer, the green bottle that you can find at 99 Ranch and most Asian supermarkets.',
    zh: '"我来自一个以啤酒和旅游闻名的海滨城市，但我不喝酒，不爱吃海鲜，也不会游泳"是我的经典破冰台词之一。<a href="https://baike.baidu.com/en/item/Qingdao%20City/985933" target="_blank" rel="noopener">青岛</a>最家喻户晓的东西大概是青岛啤酒，你都能在 99 Ranch 和大多数亚洲超市里找到。',
  },
  'pin.shouguang.story': {
    en: 'My college was called "Weifang University of Science and Technology." Still, it is actually located in <a href="https://baike.baidu.com/en/item/Shouguang%20City/1001909" target="_blank" rel="noopener">Shouguang</a>, a small city I\'d probably never have heard of if I hadn\'t gone to school there, as unknown to most people as Jiaozhou.\nHowever, it holds a lot of my firsts: first time taking a train alone, first time being so far from home (a two-hour drive, which honestly doesn\'t seem that far now... it takes similar time to drive from Berkeley to SFO in the morning, due to traffic), first time being away from home for four years, first time living like a "real adult," and the first time I dared to tell my family I was dating someone...',
    zh: '尽管我大学的名字叫"潍坊科技学院"，但它的的确确在<a href="https://baike.baidu.com/en/item/Shouguang%20City/1001909" target="_blank" rel="noopener">寿光</a>，一个如果我不是在那里上学也许永远不会听说的小城市。尽管它对大多数人来说和胶州一样名不见经传，但却承载了我很多的第一次：第一次一个人坐火车、第一次一个人离家这么远（要两个小时的车程，现在看起来其实也还好...早晨从伯克利开到 SFO 也要一个半小时，多亏了堵车）、第一次离家四年这么久、第一次像一个"大人"一样生活、第一次敢对家里人公开自己恋爱了...',
  },
  'pin.madison.story': {
    en: 'Placeholder story about Madison. A city cradled between two lakes, full of ideas and energy.',
    zh: '关于麦迪逊的故事。一座依偎在两个湖泊之间的城市，充满思想与活力。',
  },
  'pin.fairfield.story': {
    en: 'Placeholder story about Fairfield. Where the Central Valley meets the coastal hills.',
    zh: '关于费尔菲尔德的故事。中央谷地与海岸丘陵在此交汇。',
  },
  'pin.berkeley.story': {
    en: 'Placeholder story about Berkeley. Where free thinking and the Bay breeze go hand in hand.',
    zh: '关于伯克利的故事。自由思想与海湾微风相伴而行。',
  },

  // --- Professional section headings ---
  'pro.section.craft': { en: 'Craft', zh: '吃饭的手艺' },
  'pro.section.lab': { en: 'Touch Fish!', zh: '摸鱼万岁！' },

  // --- Events page ---
  'home.events': { en: 'Bay Area Tech Events Monitor', zh: '湾区科技活动监测' },
  'home.events.desc': { en: 'No more doomscrolling Luma into an existential crisis.', zh: '再也不用刷 Luma 刷到怀疑人生了。' },
  'home.joblens': { en: 'JobLens', zh: 'JobLens' },
  'home.joblens.desc': { en: 'A Chrome extension that filters LinkedIn jobs so you don\'t have to.', zh: '一个帮你过滤 LinkedIn 职位的 Chrome 扩展，省得你自己筛。' },
  'home.dreamjob': { en: 'Dream Job Monitor', zh: '理想工作监控' },
  'home.dreamjob.desc': { en: 'Fork it. Tell the AI your dream companies. Never miss a posting.', zh: 'Fork 后让 AI 帮你配置。再也不怕错过心仪的岗位。' },
  'home.brand': { en: 'Brand Guidelines', zh: '品牌指南' },
  'events.title': { en: 'New Luma Events Today', zh: '今日新增 Luma 活动' },
  'events.subtitlePre': { en: 'Tech & AI events added ', zh: '科技与 AI 活动，' },
  'events.subtitleHighlight': { en: 'only since the last daily check', zh: '仅展示每日新增' },
  'events.subtitlePost': { en: '.', zh: '。' },
  'events.whyTitle': { en: 'Why show only newly added events?', zh: '为什么设计为只显示新增活动？' },
  'events.whyPoint1': {
    en: 'This tool\u2019s primary purpose is to surface new events quickly \u2014 so you don\u2019t have to browse through the entire Luma catalog each day just to see what\u2019s new.',
    zh: '该工具的主要目的是快速呈现新增活动，免去每天为了发现新内容而反复浏览 Luma 完整列表的时间。',
  },
  'events.whyPoint2': {
    en: 'This page is intentionally designed to balance convenience and long-term availability. The data comes from an undisclosed endpoint. Keeping the feature restrained and differentiated, rather than building a full-featured alternative, helps reduce the risk of the data source being noticed and shut down.',
    zh: '本页面在设计上刻意平衡了便利性与长期可用性。数据来自一个不便公开的接口。保持功能的克制与差异化，而非构建一个全面的替代方案，有助于降低数据源被关注并停用的风险。',
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
  'events.excludeLabel': { en: 'Exclude the event including...', zh: '排除包含以下关键词的活动' },
  'events.excludePlaceholder': { en: 'in case you don\'t enjoy happy hour', zh: '万一你不喜欢 happy hour' },
  'events.moreFilters': { en: 'More filters', zh: '更多筛选' },
  'events.lessFilters': { en: 'Less filters', zh: '收起筛选' },
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

  // --- Dream Job Monitor page ---
  'djm.title': { en: 'Dream Job Monitor', zh: '理想工作监控' },
  'djm.subtitle': { en: 'An open-source seed you fork, then tell AI what to watch.', zh: '一个开源种子项目：fork 后让 AI 帮你配置监控。' },
  'djm.section.what': { en: 'What Is This', zh: '这是什么' },
  'djm.what.p1': {
    en: 'Everyone\'s dream companies are different. Instead of editing config files, you fork this repo, open it in Claude Code or Codex, say "kickoff", and the AI sets everything up through conversation.',
    zh: '每个人的理想公司都不一样。你只需 fork 这个仓库，在 Claude Code 或 Codex 中打开，输入「kickoff」，AI 就会通过对话帮你完成所有配置。',
  },
  'djm.what.p2': {
    en: 'Once deployed, it checks career pages daily and creates a GitHub Issue whenever new matching positions appear.',
    zh: '部署完成后，它会每天检查职位页面，一旦发现新的匹配岗位，就会自动创建 GitHub Issue 通知你。',
  },
  'djm.section.how': { en: 'How It Works', zh: '工作原理' },
  'djm.pipe.fetch': { en: 'Fetch', zh: '获取' },
  'djm.pipe.filter': { en: 'Filter', zh: '筛选' },
  'djm.pipe.diff': { en: 'Diff', zh: '对比' },
  'djm.pipe.notify': { en: 'Notify', zh: '通知' },
  'djm.how.body': {
    en: 'Pulls job listings from 9 ATS platforms via public APIs, filters by your keywords, diffs against previous snapshots, and creates a GitHub Issue with new matches. Runs daily via GitHub Actions.',
    zh: '通过公开 API 从 9 个 ATS 平台获取职位列表，按关键词筛选，与历史快照对比找出新增岗位，然后创建 GitHub Issue。每天通过 GitHub Actions 自动运行。',
  },
  'djm.section.quickstart': { en: 'Quick Start', zh: '快速开始' },
  'djm.step1': { en: 'Fork the repo on GitHub', zh: '在 GitHub 上 fork 仓库' },
  'djm.step2': { en: 'Open in Claude Code or Codex, say "kickoff"', zh: '在 Claude Code 或 Codex 中打开，输入「kickoff」' },
  'djm.step3': { en: 'AI asks your companies, roles, and locations', zh: 'AI 会询问你的目标公司、职位和地点' },
  'djm.step4': { en: 'Push to GitHub — Actions runs daily at 8 PM PST', zh: '推送到 GitHub — Actions 每天太平洋时间晚 8 点自动运行' },
  'djm.section.platforms': { en: 'Supported Platforms', zh: '支持的平台' },
  'djm.section.example': { en: 'See It in Action', zh: '实际用例' },
  'djm.example.intro': {
    en: 'Here\'s my own setup — watching 18 companies for marketing intern positions in the US.',
    zh: '这是我自己的配置 — 监控 18 家公司的美国市场营销实习岗位。',
  },
  'djm.example.watching': { en: 'Watching', zh: '监控中' },
  'djm.example.filtering': { en: 'Filtering for', zh: '筛选条件' },
  'djm.example.notification': { en: 'Sample Notification', zh: '通知示例' },
  'djm.example.link': { en: 'View my setup →', zh: '查看我的配置 →' },
  'djm.cta': { en: 'View on GitHub', zh: '在 GitHub 上查看' },

  // --- Language toggle button ---
  'lang.toggle': { en: '中', zh: 'EN' },
  'lang.tooltip': { en: 'Switch to Chinese', zh: 'Switch to English' },
};
