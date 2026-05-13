// ============================================
// Translation Dictionary: EN / ZH
// ============================================

export type Lang = 'en' | 'zh';

export const translations: Record<string, Record<Lang, string>> = {
  // --- Homepage ---
  'home.lifeJourney': { en: 'Journey', zh: '旅程' },

  // --- Greeting ---
  'greeting.prefix': { en: 'Where\u2019s your ', zh: '你的 ' },
  'greeting.keyword': { en: 'Negative #25', zh: '25 号底片' },
  'greeting.suffix': { en: '?', zh: '在哪里呢？' },
  'greeting.popup': {
    en: 'From <a href="https://www.imdb.com/title/tt0359950/" target="_blank">The Secret Life of Walter Mitty</a>, a film that has been encouraging me to explore the world, find myself.',
    zh: '\u51fa\u81ea<a href="https://www.imdb.com/title/tt0359950/" target="_blank">\u300a\u767d\u65e5\u68a6\u60f3\u5bb6\u300b</a>\u3002\u8fd9\u90e8\u7535\u5f71\u4e00\u76f4\u6fc0\u52b1\u7740\u6211\u63a2\u7d22\u4e16\u754c\uff0c\u627e\u5230\u81ea\u5df1\u3002',
  },
  'greeting.source': { en: 'The Secret Life of Walter Mitty', zh: '《白日梦想家》' },

  // --- Navigation ---
  'nav.back': { en: '\u2190 Home', zh: '\u2190 首页' },
  'nav.backToTop': { en: '\u2191 Top', zh: '\u2191 顶部' },

  // --- Life Journey ---
  'journey.hint': { en: 'Click a pin to read the story', zh: '点击图钉查看故事' },
  'journey.hintWip': { en: 'ALL stories are still in progress', zh: '所有故事均还未完成' },
  'journey.hintDeadline': { en: 'Trying to finish before April Fools\u2019 Day. No joke.', zh: '努力在四月一号之前完成，愚人节但不愚人' },
  'journey.china': { en: 'China', zh: '中国' },
  'journey.usa': { en: 'United States', zh: '美国' },
  'journey.city.jiaozhou': { en: 'Jiaozhou', zh: '胶州' },
  'journey.city.shouguang': { en: 'Shouguang', zh: '寿光' },
  'journey.city.qingdao': { en: 'Qingdao', zh: '青岛' },
  'journey.city.madison': { en: 'Madison', zh: '麦迪逊' },
  'journey.city.fairfield': { en: 'Fairfield', zh: '费尔菲尔德' },
  'journey.city.berkeley': { en: 'Berkeley', zh: '伯克利' },

  // --- Visual Design ---
  'craft.visual.title': { en: 'Visual Design', zh: '视觉设计' },

  // --- Common ---
  'common.comingSoon': { en: 'Content coming soon...', zh: '内容即将上线…' },

  // --- Globe pin locations ---
  'pin.jiaozhou.city': { en: 'Jiaozhou', zh: '胶州' },
  'pin.jiaozhou.country': { en: 'Shandong, China', zh: '中国山东' },
  'pin.shouguang.city': { en: 'Shouguang', zh: '寿光' },
  'pin.shouguang.country': { en: 'Shandong, China', zh: '中国山东' },
  'pin.qingdao.city': { en: 'Qingdao', zh: '青岛' },
  'pin.qingdao.country': { en: 'Shandong, China', zh: '中国山东' },
  'pin.madison.city': { en: 'Madison', zh: '麦迪逊' },
  'pin.madison.country': { en: 'Wisconsin, USA', zh: '美国威斯康星' },
  'pin.fairfield.city': { en: 'Fairfield', zh: '费尔菲尔德' },
  'pin.fairfield.country': { en: 'California, USA', zh: '美国加利福尼亚' },
  'pin.berkeley.city': { en: 'Berkeley', zh: '伯克利' },
  'pin.berkeley.country': { en: 'California, USA', zh: '美国加利福尼亚' },

  // --- Globe pin titles ---
  'pin.jiaozhou.title': { en: 'Where this wonderfully absurd life began', zh: '奇妙人生开始的地方' },
  'pin.qingdao.title': { en: 'Qingdao & Tsingtao', zh: '青岛与青岛啤酒' },
  'pin.shouguang.title': { en: 'Every Step Counts', zh: '每一步都算数' },
  'pin.madison.title': { en: 'Between the lakes', zh: '湖间小城' },
  'pin.fairfield.title': { en: 'Freedom and Hope', zh: '自由与希望' },
  'pin.berkeley.title': { en: 'Stories here are still unfolding...', zh: '在伯克利的故事还在展开...' },

  // --- Globe pin stories (placeholder) ---
  'pin.jiaozhou.story': {
    en: '<a href="https://baike.baidu.com/en/item/Jiaozhou%20City/997960" target="_blank" rel="noopener">Jiaozhou</a> is my real hometown, a place famously known for not being known... Which is why, if someone asks me where I\'m from, I always say Qingdao. (Technically, Jiaozhou is part of Qingdao. So it\'s not entirely a lie.)\n\nOne day in the last century, a person who was bad at English and absolutely terrible at math, even through high school, yet somehow ended up working as a Data Scientist in the USA was born.\n\n<strong>That\'s me.</strong>\n\n<img src="/images/journey/jiaozhou-baby.webp" alt="Baby Kun with mom in Jiaozhou" class="story-photo" />',
    zh: '<a href="https://baike.baidu.com/en/item/Jiaozhou%20City/997960" target="_blank" rel="noopener">胶州</a>是我真正的家乡，尽管有 5000 年的历史，但是很少有人听说过，所以有人问我是哪里人的时候，我总是说青岛的。（好在胶州确实属于青岛，所以也不全错。）\n\n上世纪某一天，一个不怎么擅长英语、数学也有些烂，结果最终跑到一个说英文的国家做数据科学的我诞生了。\n\n<strong>就是我。</strong>\n\n<img src="/images/journey/jiaozhou-baby.webp" alt="婴儿时期的坤和妈妈在胶州" class="story-photo" />',
  },
  'pin.qingdao.story': {
    en: '"I\'m from a seaside city known for beer and tourism, but I don\'t drink, don\'t like seafood, and don\'t know how to swim" is one of my classic ice breakers.\n\nThe most famous thing about <a href="https://baike.baidu.com/en/item/Qingdao%20City/985933" target="_blank" rel="noopener">Qingdao</a> is probably Tsingtao Beer, the green bottle that you can find at 99 Ranch and most Asian supermarkets.',
    zh: '"我来自一个以啤酒和旅游闻名的海滨城市，但我不喝酒，不爱吃海鲜，也不会游泳"是我的经典破冰台词之一。\n\n<a href="https://baike.baidu.com/en/item/Qingdao%20City/985933" target="_blank" rel="noopener">青岛</a>最家喻户晓的东西大概是青岛啤酒，你都能在 99 Ranch 和大多数亚洲超市里找到。',
  },
  'pin.shouguang.story': {
    en: 'My college was called "Weifang University of Science and Technology." Still, it is actually located in <a href="https://baike.baidu.com/en/item/Shouguang%20City/1001909" target="_blank" rel="noopener">Shouguang</a>, a small city I\'d probably never have heard of if I hadn\'t gone to school there, as unknown to most people as Jiaozhou.\n\nHowever, it holds a lot of my firsts: first time taking a train alone, first time being so far from home (a two-hour drive, which honestly doesn\'t seem that far now... it takes similar time to drive from Berkeley to SFO in the morning, due to traffic), first time being away from home for four years, first time living like a "real adult," and the first time I dared to tell my family I was dating someone...',
    zh: '尽管我大学的名字叫"潍坊科技学院"，但它的的确确在<a href="https://baike.baidu.com/en/item/Shouguang%20City/1001909" target="_blank" rel="noopener">寿光</a>，一个如果我不是在那里上学也许永远不会听说的小城市。\n\n尽管它对大多数人来说和胶州一样名不见经传，但却承载了我很多的第一次：第一次一个人坐火车、第一次一个人离家这么远（要两个小时的车程，现在看起来其实也还好...早晨从伯克利开到 SFO 也要一个半小时，多亏了堵车）、第一次离家四年这么久、第一次像一个"大人"一样生活、第一次敢对家里人公开自己恋爱了...',
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
    en: 'Come with me to <a href="https://maps.app.goo.gl/AJMEjizHQyYtX2Kw5" target="_blank" rel="noopener"><u>Grizzly Peak</u></a> -- the Bay Area lights up beautifully at night.\n\n<img class="story-photo" src="/images/journey/berkeley-grizzly-peak.webp" alt="Bay Area night view from Grizzly Peak" />',
    zh: '一起去 <a href="https://maps.app.goo.gl/AJMEjizHQyYtX2Kw5" target="_blank" rel="noopener"><u>Grizzly Peak</u></a> 看看湾区夜景吧。\n\n<img class="story-photo" src="/images/journey/berkeley-grizzly-peak.webp" alt="从 Grizzly Peak 俯瞰湾区夜景" />',
  },

  // --- Professional section headings ---
  'pro.section.lab': { en: 'Touch Fish!', zh: '摸鱼万岁！' },
  'pro.section.explain': {
    en: '\u201cTouch Fish\u201d (\u6478\u9c7c, m\u014d y\u00fa) is Chinese internet slang for slacking off when you\u2019re supposed to be doing real work. These tools were built in that spirit.',
    zh: '\u4e3a\u4e86\u66f4\u597d\u7684\u6478\u9c7c',
  },

  // --- Events page ---
  'home.events': { en: 'Today\'s New Tech Events @Bay Area', zh: '今日湾区新增科技活动' },
  'home.events.desc': { en: 'No more doomscrolling event platforms into an existential crisis.', zh: '再也不用刷活动平台刷到怀疑人生了。' },

  'home.sift': { en: 'Sift', zh: 'Sift' },
  'home.sift.desc': { en: 'Take back a LinkedIn worth your time.', zh: '夺回值得你时间的 LinkedIn。' },
  'events.title': { en: 'Today\'s New Tech Events @Bay Area', zh: '今日湾区新增科技活动' },
  'events.subtitlePre': { en: 'Bay Area Tech & AI events from Luma, showing ', zh: '来自 Luma 的湾区科技与 AI 活动，仅展示' },
  'events.subtitleHighlight': { en: 'only what\'s new since the last daily check', zh: '上次检查后的新增' },
  'events.subtitlePost': { en: '.', zh: '。' },
  'events.whyTitle': { en: 'Why show only newly added events?', zh: '为什么设计为只显示新增活动？' },
  'events.whyPoint1': {
    en: 'This page pulls from Luma\'s Bay Area Tech and AI categories once a day. It only shows events that appeared since the last check \u2014 not the full catalog. If you\'re looking for a specific event or topic outside Tech/AI, search directly on the platform.',
    zh: '本页面每天从 Luma 的湾区 Tech 和 AI 分类中拉取一次数据，只展示上次检查后新增的活动，不是完整列表。如果你要找特定活动或 Tech/AI 以外的主题，请直接在平台上搜索。',
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
  'events.searchLabel': { en: 'Search Events or Hosts', zh: '搜索活动或主办方' },
  'events.searchPlaceholder': { en: 'e.g. hackathon, google, etc', zh: '如：hackathon、google' },
  'events.excludeLabel': { en: 'Exclude the event including...', zh: '排除包含以下关键词的活动' },
  'events.excludePlaceholder': { en: 'in case you don\'t enjoy happy hour', zh: '万一你不喜欢 happy hour' },
  'events.clearFilters': { en: 'Clear filters', zh: '清除筛选' },
  'events.noMatch': { en: 'No events match filters', zh: '没有匹配的活动' },
  'events.showMore': { en: 'More', zh: '更多' },
  'events.showLess': { en: 'Less', zh: '收起' },

  // --- Brand Guidelines page ---
  'brand.title': { en: 'Brand Guidelines', zh: '品牌规范' },
  'brand.principles': { en: 'Design Philosophy', zh: '设计哲学' },
  'brand.principleMinimal': { en: 'Minimal', zh: '极简' },
  'brand.principleMinimalDesc1': {
    en: 'Page depth ≤ 3. Dependencies in single digits. No framework where static HTML will do.',
    zh: '页面层级 ≤ 3。依赖个位数。静态 HTML 能做的事不用框架。',
  },
  'brand.principleMinimalDesc2': {
    en: 'If it doesn\'t serve a purpose, it doesn\'t exist.',
    zh: '没有存在意义的东西，就不该存在。',
  },
  'brand.principleWarm': { en: 'Warm', zh: '温暖' },
  'brand.principleWarmDesc1': {
    en: 'The palette was refined from my deeply loved character -- 小龙格林, a little dragon.',
    zh: '配色源自我深爱的角色——小龙格林，一只小龙。',
  },
  'brand.principleWarmDesc2': {
    en: 'Warm like the character itself.',
    zh: '像这个角色本身一样温暖。',
  },
  'brand.principlePersonal': { en: 'Personal', zh: '个人' },
  'brand.principlePersonalDesc': {
    en: 'Who I am, not what I\'ve done.',
    zh: '关于我是谁，而不是我做过什么。',
  },
  'brand.colors': { en: 'Color Palette', zh: '配色方案' },
  'brand.typography': { en: 'Typography', zh: '字体排印' },
  'brand.typeFonts': { en: 'Font Pairing', zh: '字体搭配' },
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
  'brand.usage.greenText': { en: 'Green text', zh: '绿色文字' },
  'brand.usage.blueText': { en: 'Blue text', zh: '蓝色文字' },
  'brand.usage.pinkText': { en: 'Pink text', zh: '粉色文字' },
  'brand.usage.textLight': { en: 'Subtle / decorative', zh: '装饰性文字' },
  'brand.usage.textMid': { en: 'Secondary text', zh: '次要文字' },
  'brand.usage.textPrimary': { en: 'Primary text', zh: '主要文字' },

  // --- Events Privacy ---
  'events.privacyTitle': { en: 'Privacy', zh: '隐私' },
  'events.privacyDesc': {
    en: 'This page runs entirely in your browser. Event data is fetched from a public source and displayed directly. No personal data is collected, transmitted, or stored.',
    zh: '本页面完全在你的浏览器中运行。活动数据从公开来源获取并直接显示。不收集、传输或存储任何个人数据。',
  },
  'events.privacyLink': { en: 'Full privacy policy \u2192', zh: '完整隐私政策 \u2192' },

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
  'events.timeAny': { en: 'Any', zh: '不限' },

  // --- Sift (formerly JobLens) ---
  'sift.subtitle': {
    en: 'Take back a LinkedIn worth your time.',
    zh: '夺回值得你时间的 LinkedIn。',
  },
  'sift.inspirationTitle': { en: 'Inspiration', zh: '灵感来源' },
  'sift.inspiration1': {
    en: 'LinkedIn is great at surfacing relevant jobs and content. But the experience? Ads everywhere, "Suggested" posts from strangers, reposted job listings, no way to tell if a role sponsors visas without clicking through. Your feed is half noise, and your job search is mostly triage.',
    zh: 'LinkedIn 的推荐算法确实好用，但体验呢？到处都是广告、陌生人的「推荐」帖子、重复发布的职位，不点进去根本不知道是否赞助签证。你的动态一半是噪音，求职大部分时间在做无用功。',
  },
  'sift.inspiration2': {
    en: 'Sift exists because the platform is good but the workflow is broken. It cleans up both sides of LinkedIn: your feed and your job search.',
    zh: 'Sift 的存在是因为平台本身不错，但工作流程不行。它同时清理 LinkedIn 的两个方面：你的动态和求职页面。',
  },
  'sift.changelogTitle': { en: 'Changelog', zh: '更新日志' },
  'sift.feedTitle': { en: 'Feed Cleanup', zh: '动态清理' },
  'sift.feedDesc': {
    en: 'Sift automatically hides ads, suggested posts, recommended content, and posts matching your custom keywords. One-click Unfollow appears inline on every post \u2014 no digging through menus.',
    zh: 'Sift 自动隐藏 LinkedIn 动态中的广告、推荐帖子、建议内容以及匹配自定义关键词的帖子。一键取关按钮直接显示在每条帖子上，无需翻找菜单。',
  },
  'sift.feat.hideAds': { en: '<strong>Hide Ads</strong>: removes Promoted posts automatically', zh: '<strong>隐藏广告</strong>：自动移除推广帖子' },
  'sift.feat.hideSuggested': { en: '<strong>Hide Suggested & Recommended</strong>: filters non-connection noise', zh: '<strong>隐藏推荐</strong>：过滤非人脉噪音' },
  'sift.feat.hideStrangers': { en: '<strong>Hide Strangers</strong>: filter posts from non-connections', zh: '<strong>隐藏陌生人</strong>：过滤非人脉帖子' },
  'sift.feat.unfollow': { en: '<strong>One-click Unfollow</strong>: appears next to "1st" on posts and interaction headers ("XXX likes this")', zh: '<strong>一键取关</strong>：显示在帖子和互动行（「XXX 赞了此帖」）的「1st」旁边' },
  'sift.feat.contextMenu': { en: '<strong>Mute Keyword</strong>: right-click any text on LinkedIn to instantly add it to your keyword filter', zh: '<strong>屏蔽关键词</strong>：右键 LinkedIn 上任意文字，即时加入关键词过滤' },
  'sift.feat.autoCollapse': { en: '<strong>Auto-collapse</strong>: "You unfollowed X" confirmation cards collapse automatically', zh: '<strong>自动折叠</strong>：取关确认卡片自动折叠' },
  'sift.feat.hideSidebar': { en: '<strong>Hide Sidebar</strong>: remove LinkedIn News and footer clutter', zh: '<strong>隐藏侧边栏</strong>：移除 LinkedIn News 和页脚杂乱内容' },
  'sift.feat.keywords': { en: '<strong>Keyword Filter</strong>: define custom keywords to hide matching posts', zh: '<strong>关键词过滤</strong>：自定义关键词隐藏匹配帖子' },
  'sift.feat.badge': { en: '<strong>Live Badge</strong>: floating counter shows how many posts have been filtered', zh: '<strong>实时徽章</strong>：浮动计数器显示已过滤的帖子数量' },
  'sift.feat.iconBadge': { en: '<strong>Icon Badge</strong>: extension icon shows the filtered count at a glance', zh: '<strong>图标徽章</strong>：扩展图标一目了然地显示过滤数量' },
  'sift.feat.polls': { en: '<strong>Hide Polls</strong>: filter out LinkedIn polls from your feed', zh: '<strong>隐藏投票</strong>：过滤动态中的 LinkedIn 投票' },
  'sift.feat.celebrations': { en: '<strong>Hide Celebrations</strong>: hide job updates, work anniversaries, birthdays, and promotions', zh: '<strong>隐藏庆祝帖</strong>：隐藏工作变动、工作周年、生日和晋升' },
  'sift.feat.postAge': { en: '<strong>Hide Old Posts</strong>: hide posts older than 1 day, 3 days, 1 week, 2 weeks, or 1 month', zh: '<strong>隐藏旧帖</strong>：隐藏超过 1 天、3 天、1 周、2 周或 1 个月的帖子' },
  'sift.feat.upsells': { en: '<strong>Hide Upsells</strong>: removes "Try Campaign Manager" and similar promotions', zh: '<strong>隐藏推销</strong>：移除"试用 Campaign Manager"等推广信息' },
  'sift.feat.pause': { en: '<strong>Shift+J</strong>: pause/resume all filters instantly', zh: '<strong>Shift+J</strong>：即时暂停/恢复所有过滤器' },
  'sift.profileTitle': { en: 'Profile & Network', zh: '个人主页与人脉' },
  'sift.profileDesc': {
    en: 'Sift also cleans up your profile and My Network pages — hiding sidebar clutter, ads, analytics you don\'t need, and game promotions.',
    zh: 'Sift 同样清理你的个人主页和人脉页面——隐藏侧边栏杂乱内容、广告、不需要的分析数据和游戏推广。',
  },
  'sift.feat.profileSidebar': { en: '<strong>Hide Profile Sidebar</strong>: removes ads, "People you may know", and "You might like" panels', zh: '<strong>隐藏主页侧边栏</strong>：移除广告、"你可能认识"和"你可能喜欢"面板' },
  'sift.feat.profileAnalytics': { en: '<strong>Hide Analytics</strong>: hides profile views, impressions, and search appearances', zh: '<strong>隐藏分析</strong>：隐藏主页浏览量、曝光量和搜索出现次数' },
  'sift.feat.networkAds': { en: '<strong>Hide Network Ads</strong>: removes Promoted ads from My Network', zh: '<strong>隐藏人脉广告</strong>：移除"我的人脉"页面的推广广告' },
  'sift.feat.networkGame': { en: '<strong>Hide Game Promo</strong>: removes LinkedIn game promotions', zh: '<strong>隐藏游戏推广</strong>：移除 LinkedIn 游戏推广' },
  'sift.jobsTitle': { en: 'Job Search Intelligence', zh: '智能求职' },
  'sift.jobsDesc': {
    en: 'On LinkedIn\'s job search results page, Sift flags suspicious listings so you skip the ones not worth your time.',
    zh: '在 LinkedIn 求职搜索结果页面，Sift 标记可疑职位，帮你跳过不值得花时间的岗位。',
  },
  'sift.flag.reposted': { en: 'Job has been reposted \u2014 stale listing', zh: '岗位已被转发 \u2014 过期职位' },
  'sift.flag.applied': { en: 'You already applied to this one', zh: '你已经申请过这个岗位' },
  'sift.flag.noSponsor': { en: 'Description says visa sponsorship not available', zh: '职位描述中表明不提供签证赞助' },
  'sift.flag.unpaid': { en: 'Volunteer or unpaid position', zh: '志愿者或无薪岗位' },
  'sift.flag.skippedCo': { en: 'Company on your skip list', zh: '你屏蔽列表中的公司' },
  'sift.flag.skippedTitle': { en: 'Title contains a keyword you\'re avoiding', zh: '职位名称包含你要排除的关键词' },
  'sift.demoTitle': { en: 'See It in Action', zh: '实际效果' },
  'sift.cap.badges': { en: 'Badges flag issues at a glance', zh: '标记一目了然' },
  'sift.cap.dim': { en: 'Dim mode fades flagged cards', zh: '淡化模式让已标记的卡片变暗' },
  'sift.startTitle': { en: 'Get Started', zh: '快速开始' },
  'sift.step1': { en: 'Install from the <a href="https://chromewebstore.google.com/detail/ainpeagpaoafcblhcebbakofagiocooa?utm_source=kunli_website" class="sift-link" target="_blank" rel="noopener">Chrome Web Store</a>', zh: '从 <a href="https://chromewebstore.google.com/detail/ainpeagpaoafcblhcebbakofagiocooa?utm_source=kunli_website" class="sift-link" target="_blank" rel="noopener">Chrome 网上应用店</a>安装' },
  'sift.step2': { en: 'Visit <strong>LinkedIn</strong> \u2014 your feed is automatically cleaned up', zh: '访问 <strong>LinkedIn</strong> \u2014 你的动态自动被清理' },
  'sift.step3': { en: 'Go to <strong>Jobs \u2192 Search Results</strong> \u2014 cards are auto-flagged', zh: '打开<strong>职位 \u2192 搜索结果</strong> \u2014 卡片自动被标记' },
  'sift.step4': { en: 'Click the <strong>Sift icon</strong> to adjust settings, view stats, or export data', zh: '点击 <strong>Sift 图标</strong>调整设置、查看统计或导出数据' },
  'sift.step5': { en: 'Hover any post to <strong>Unfollow</strong> the author with one click', zh: '悬停任意帖子即可一键 <strong>Unfollow</strong> 作者' },
  'sift.howTitle': { en: 'How It Works', zh: '工作原理' },
  'sift.pipe.detect': { en: 'Detect', zh: '检测' },
  'sift.pipe.badge': { en: 'Badge', zh: '标记' },
  'sift.pipe.filter': { en: 'Filter', zh: '筛选' },
  'sift.pipe.focus': { en: 'Focus', zh: '聚焦' },
  'sift.howDesc': {
    en: 'Reads page content directly in the browser. No external servers, no API calls. Everything runs locally. Your preferences are stored via Chrome\'s local storage.',
    zh: '直接在浏览器中读取页面内容。没有外部服务器，没有 API 调用。一切在本地运行。偏好设置通过 Chrome 本地存储保存。',
  },
  'sift.privacyTitle': { en: 'Privacy', zh: '隐私' },
  'sift.privacyDesc': {
    en: 'Sift runs entirely in your browser. No data is collected, transmitted, or stored externally. All preferences and stats stay on your device.',
    zh: 'Sift 完全在你的浏览器中运行。不收集、传输或存储任何外部数据。所有偏好和统计数据保留在你的设备上。',
  },
  'sift.privacyLink': { en: 'Full privacy policy \u2192', zh: '完整隐私政策 \u2192' },
  'sift.openSourceTitle': { en: 'Open Source', zh: '开源' },
  'sift.openSourceDesc': { en: 'Sift is open source under the MIT license. You can read every line of code, verify the privacy claims yourself, or contribute improvements.', zh: 'Sift 以 MIT 协议开源。你可以阅读每一行代码，亲自验证隐私声明，或者贡献改进。' },

  // --- Sift Feedback ---
  'sift.feedback': { en: 'Feedback', zh: '反馈' },
  'sift.feedbackTitle': { en: 'Any Suggestion? Pls!!!', zh: '有什么建议吗？求求了！！！' },
  'sift.feedbackSend': { en: 'Send', zh: '发送' },
  'sift.feedbackSent': { en: 'Thanks! Feedback sent.', zh: '谢谢！反馈已发送。' },
  'sift.feedbackError': { en: 'Failed to send. Try again?', zh: '发送失败，再试一次？' },

  // --- 404 page ---
  '404.message': { en: 'This page doesn\'t exist or has been moved.', zh: '页面不存在或已迁移。' },
  '404.home': { en: 'Back to Home', zh: '返回首页' },

  // --- Language toggle button ---
  'lang.toggle': { en: '中', zh: 'EN' },
  'lang.tooltip': { en: 'Switch to Chinese', zh: 'Switch to English' },
};
