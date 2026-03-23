export interface SiftChangelogEntry {
  version: string;
  why: { en: string; zh: string };
  changes: { en: string[]; zh: string[] };
}

export const siftChangelog: SiftChangelogEntry[] = [
  {
    version: 'v2.5',
    why: {
      en: 'Sift now cleans up your profile and My Network pages too — not just the feed and job search.',
      zh: 'Sift 现在也能清理个人主页和「我的人脉」页面，不只是 Feed 和求职搜索。',
    },
    changes: {
      en: [
        'Profile page: hide right sidebar (ads, "People you may know", "You might like")',
        'Profile page: hide Analytics section (profile views, impressions, search appearances)',
        'My Network page: hide Promoted ads in sidebar',
        'My Network page: hide "Need a 30 second break?" game promotions',
        'New "Profile Page" section in popup with dedicated toggle',
        'Poll filter: hide LinkedIn polls from your feed',
        'New user onboarding: welcome toast on first install',
      ],
      zh: [
        '个人主页：隐藏右侧栏（广告、「你可能认识」、「你可能喜欢」）',
        '个人主页：隐藏 Analytics 区域（主页浏览、曝光、搜索出现次数）',
        '「我的人脉」页面：隐藏侧栏推广广告',
        '「我的人脉」页面：隐藏「来玩 30 秒小游戏」推广',
        '弹窗新增「Profile Page」区域，带独立开关',
        '投票过滤：隐藏 LinkedIn 投票帖',
        '新用户引导：首次安装后显示欢迎提示',
      ],
    },
  },
  {
    version: 'v2.3',
    why: {
      en: 'Keyword filtering, icon badge, and a proper build system. Also: Sift is now open source!',
      zh: '关键词过滤、图标徽章、正式构建系统。另外：Sift 现已开源！',
    },
    changes: {
      en: [
        'Feed keyword filter: define custom keywords to hide matching posts',
        'Extension icon badge: filtered/flagged count shown on the Sift icon',
        'SPA navigation: instant detection via History API (no more 1s polling delay)',
        'ES Modules + esbuild: source in src/, bundled to IIFE for Chrome extension',
        'Automated tests: 23 test cases with vitest',
        'Open source under MIT license',
      ],
      zh: [
        'Feed 关键词过滤：自定义关键词隐藏匹配帖子',
        '扩展图标徽章：在 Sift 图标上显示过滤/标记数量',
        'SPA 导航优化：通过 History API 即时检测（不再有 1 秒轮询延迟）',
        'ES Modules + esbuild：源码在 src/，打包为 IIFE 供 Chrome 扩展使用',
        '自动化测试：23 个测试用例，使用 vitest',
        '以 MIT 协议开源',
      ],
    },
  },
  {
    version: 'v2.2',
    why: {
      en: 'Reliability and code quality. Sift now survives SPA navigation without a manual refresh.',
      zh: '可靠性和代码质量提升。Sift 现在在 SPA 导航后自动恢复，无需手动刷新。',
    },
    changes: {
      en: [
        'SPA navigation fix: Sift re-activates automatically when navigating back to the feed',
        'Shared defaults: single source of truth across all scripts',
        'Stats batching for job scans (fewer storage writes)',
        'Jobs panel shortcut changed from Ctrl+Shift+J to Ctrl+Shift+S (avoids DevTools conflict)',
        'Popup stats refresh updates in-place instead of rebuilding DOM',
        'Magic numbers extracted to named constants for easier tuning',
      ],
      zh: [
        'SPA 导航修复：从其他页面返回 feed 时 Sift 自动恢复',
        '共享默认值：所有脚本使用统一的配置源',
        '求职扫描统计批处理（减少存储写入）',
        '求职面板快捷键从 Ctrl+Shift+J 改为 Ctrl+Shift+S（避免 DevTools 冲突）',
        '弹窗统计刷新改为原地更新，不再重建 DOM',
        '魔法数字提取为命名常量，便于调优',
      ],
    },
  },
  {
    version: 'v2.1',
    why: {
      en: 'Fewer clicks, more control. Mute and Unfollow now live right on every post.',
      zh: '更少点击，更多掌控。Mute 和 Unfollow 按钮现在直接显示在每条帖子上。',
    },
    changes: {
      en: [
        'Inline Mute & Unfollow buttons on every post — no more hunting for the ... menu',
        'Search your keyword rules from the popup',
        'Simplified popup: removed float toggles, split into clearer sections',
        'Narrowed job search scope to search results page for a more focused experience',
        'Fixed hidden cards not reappearing when toggling hideFiltered off',
      ],
      zh: [
        '每条帖子上直接显示 Mute 和 Unfollow 按钮，不用再找 ... 菜单',
        '弹窗中可搜索关键词规则',
        '简化弹窗：移除浮动开关，分区更清晰',
        '收窄求职页面范围至搜索结果页，体验更聚焦',
        '修复切换 hideFiltered 时隐藏卡片不重新显示的问题',
      ],
    },
  },
  {
    version: 'v2.0',
    why: {
      en: 'LinkedIn isn\'t just job search — your feed is half ads too. Why not clean up both?',
      zh: 'LinkedIn 不只有求职页面，你的 feed 也是一半广告。为什么不一起清理？',
    },
    changes: {
      en: [
        'Feed cleanup: hide ads, suggested, recommended posts; mute keywords; one-click unfollow',
        'Popup redesign: Controls, Stats, and Data tabs replace the floating panel',
        'Removed mute-person feature in favor of unfollow; keyword muting kept for spam filtering',
        'Stats tracking: daily and all-time counts for all filter actions',
      ],
      zh: [
        'Feed 清理：隐藏广告、推荐、建议帖子；关键词屏蔽；一键取消关注',
        '弹窗重新设计：Controls、Stats、Data 标签页取代浮动面板',
        '移除了屏蔽人功能，改用取消关注；保留关键词屏蔽用于过滤垃圾内容',
        '统计追踪：所有过滤操作的每日和累计计数',
      ],
    },
  },
  {
    version: 'v1.0',
    why: {
      en: 'LinkedIn search shows everything: reposted, applied, no-sponsor. Why not flag them automatically?',
      zh: 'LinkedIn 搜索什么都显示：已转发、已申请、不赞助签证。为什么不自动标记呢？',
    },
    changes: {
      en: [
        'Auto-scan LinkedIn job cards and flag Reposted, Applied, No Sponsor, Unpaid',
        'Skip lists for companies and title keywords, with batch import/export',
        'Draggable frosted-glass panel with dim mode for filtered cards',
      ],
      zh: [
        '自动扫描 LinkedIn 职位卡片，标记 Reposted、Applied、No Sponsor、Unpaid',
        '公司和职位关键词屏蔽列表，支持批量导入导出',
        '可拖动的毛玻璃面板，淡化模式让已标记卡片变暗',
      ],
    },
  },
];
