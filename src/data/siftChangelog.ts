export interface SiftChangelogEntry {
  version: string;
  why: { en: string; zh: string };
  changes: { en: string[]; zh: string[] };
}

export const siftChangelog: SiftChangelogEntry[] = [
  {
    version: "v3.1",
    why: {
      en: "Hotfix for LinkedIn layout regressions, plus guardrails so the next one fails before release.",
      zh: "修复 LinkedIn 布局回归，并补上发布前能拦住同类问题的防护。",
    },
    changes: {
      en: [
        'My Network "Grow" page no longer renders blank when game promos are hidden',
        "Removed an unguarded narrow-screen CSS rule that could affect unrelated LinkedIn pages",
        "Added CSS namespace checks and a manual page coverage matrix for release testing",
      ],
      zh: [
        "隐藏游戏推广时，「我的人脉」Grow 页面不再整页空白",
        "移除未加保护的窄屏 CSS 规则，避免影响无关 LinkedIn 页面",
        "新增 CSS 命名空间检查和手动页面覆盖矩阵，用于发布前验证",
      ],
    },
  },
  {
    version: "v3",
    why: {
      en: "Stats are easier to scan, and destructive resets now require deliberate confirmation.",
      zh: "统计更容易快速查看，危险重置操作也需要明确确认。",
    },
    changes: {
      en: [
        "Stats tab now shows Today and All Time side by side in one compact grid",
        "Reset Stats and Reset All Data now require typing the reset phrase before confirming",
        "Pre-commit hook rebuilds tracked Chrome bundles when source files change",
      ],
      zh: [
        "Stats 标签页将 Today 和 All Time 合并到一个紧凑表格中",
        "Reset Stats 和 Reset All Data 现在需要输入确认短语后才能执行",
        "提交前 hook 会在源码变更时自动重建已跟踪的 Chrome bundle",
      ],
    },
  },
  {
    version: "v2.18",
    why: {
      en: "A correctness pass that makes diagnostics, pause mode, and import failures more honest.",
      zh: "一轮正确性修复，让诊断、暂停模式和导入失败提示更可信。",
    },
    changes: {
      en: [
        "Smart diagnostic warnings now flag filters that are on but matching nothing",
        "Pause Sift now suspends badges, borders, stats, and auto-skip side effects too",
        "Import, reset, storage, and jobs init failures now surface real error messages",
      ],
      zh: [
        "智能诊断现在会提示已开启但没有匹配到内容的过滤器",
        "Pause Sift 现在也会暂停徽章、边框、统计和自动跳过副作用",
        "导入、重置、存储和职位页初始化失败会显示真实错误信息",
      ],
    },
  },
  {
    version: "v2.17",
    why: {
      en: "Live page diagnostics, a master pause switch, and stronger keyword controls.",
      zh: "实时页面诊断、总暂停开关，以及更强的关键词控制。",
    },
    changes: {
      en: [
        'Popup now shows an "On this page" diagnostic strip with live filter counts',
        "Added Pause Sift to temporarily suspend filtering without deleting settings",
        "Added Whole word, Substring, and Regex keyword match modes",
        "Skip lists can be edited from the popup, with undo for accidental company skips",
      ],
      zh: [
        "弹窗新增「On this page」诊断条，实时显示过滤计数",
        "新增 Pause Sift，可临时暂停过滤而不删除设置",
        "新增 Whole word、Substring 和 Regex 三种关键词匹配模式",
        "可在弹窗编辑跳过列表，并支持误跳过公司后的撤销",
      ],
    },
  },
  {
    version: "v2.14",
    why: {
      en: "Profile page hotfix for LinkedIn 2026 layout changes.",
      zh: "针对 LinkedIn 2026 布局变化的个人主页热修复。",
    },
    changes: {
      en: [
        "Hide Analytics no longer hides the entire profile main column",
        "Added a Chrome Web Store packaging script with version drift checks",
      ],
      zh: [
        "隐藏 Analytics 不再误隐藏整个个人主页主列",
        "新增 Chrome Web Store 打包脚本，并检查版本号漂移",
      ],
    },
  },
  {
    version: "v2.11",
    why: {
      en: "Job search filters and data tools got more precise and safer.",
      zh: "求职过滤和数据工具更精确，也更安全。",
    },
    changes: {
      en: [
        "Good Match badge highlights jobs LinkedIn Premium rates as a strong fit",
        "Auto-skip Flagged Companies can add detected No Sponsor and Unpaid companies to your skip list",
        "Data tab shows storage usage and validates imported backups before applying them",
        "Skipped Companies and Title Keywords now use whole-word matching",
      ],
      zh: [
        "Good Match 徽章会标出 LinkedIn Premium 判断为强匹配的职位",
        "自动跳过已标记公司可将 No Sponsor 和 Unpaid 公司加入跳过列表",
        "Data 标签页显示存储用量，并在应用前验证导入备份",
        "跳过公司和职位关键词现在使用整词匹配",
      ],
    },
  },
  {
    version: "v2.10",
    why: {
      en: "Small fixes for the jobs page and LinkedIn single-page navigation.",
      zh: "职位页和 LinkedIn 单页导航的小修复。",
    },
    changes: {
      en: [
        "Mini status badge no longer overlaps the in-page jobs panel",
        "Scan button resets correctly when navigating between job searches",
      ],
      zh: [
        "迷你状态徽章不再遮挡职位页内的 Sift 面板",
        "在不同职位搜索之间导航时，扫描按钮会正确重置",
      ],
    },
  },
  {
    version: "v2.9",
    why: {
      en: "Right-click to mute keywords. Unfollow directly from interaction posts.",
      zh: "右键屏蔽关键词。直接从互动帖中取消关注。",
    },
    changes: {
      en: [
        'Right-click "Mute keyword": select any text on LinkedIn → right-click → instantly add to keyword filter',
        'Unfollow on interaction posts: "XXX likes this" / "XXX reposted" now shows Unfollow for 1st-degree connections',
        "Code quality: DRY refactoring, removed dead code, simplified matching logic",
      ],
      zh: [
        "右键「屏蔽关键词」：选中 LinkedIn 上任意文字 → 右键 → 即时加入关键词过滤",
        "互动帖取消关注：「XXX 赞了此帖」/「XXX 转发了此帖」现在为一度人脉显示 Unfollow 按钮",
        "代码质量：DRY 重构、移除死代码、简化匹配逻辑",
      ],
    },
  },
  {
    version: "v2.8",
    why: {
      en: "LinkedIn completely restructured their DOM. Sift adapts. All filters restored.",
      zh: "LinkedIn 完全重构了页面结构。Sift 已适配，所有过滤器已恢复。",
    },
    changes: {
      en: [
        "Full compatibility with LinkedIn 2026 DOM restructure",
        "Continuous interval scanning replaces unreliable MutationObserver",
        "Improved non-connection detection: excludes interaction posts (likes/reposts)",
        "Fixed post age filter for new DOM structure",
        "Fixed sidebar hiding for new 3-column layout",
      ],
      zh: [
        "完全兼容 LinkedIn 2026 DOM 重构",
        "持续轮询扫描取代不可靠的 MutationObserver",
        "改进陌生人检测：排除互动帖（点赞/转发）",
        "修复新 DOM 结构下的帖子时间过滤",
        "修复新三栏布局下的侧栏隐藏",
      ],
    },
  },
  {
    version: "v2.7",
    why: {
      en: "Hide celebration posts and catch more feed noise.",
      zh: "隐藏庆祝帖和更多 Feed 噪音。",
    },
    changes: {
      en: [
        "Hide Celebrations: filter out job updates, work anniversaries, birthdays, and promotions",
        "Top applicant job cards now caught by Hide Recommended filter",
      ],
      zh: [
        "隐藏庆祝帖：过滤掉职位更新、工作周年、生日和晋升帖",
        "「你是最佳申请人」职位卡片现在被「隐藏推荐」过滤器覆盖",
      ],
    },
  },
  {
    version: "v2.6",
    why: {
      en: "Post age filtering and upsell removal.",
      zh: "帖子时间过滤和推广隐藏。",
    },
    changes: {
      en: [
        "Post age filter: hide posts older than 1 day / 3 days / 1 week / 2 weeks / 1 month",
        'Hide "Try Campaign Manager" and similar upsell promotions',
      ],
      zh: [
        "帖子时间过滤：隐藏超过 1 天 / 3 天 / 1 周 / 2 周 / 1 个月的帖子",
        "隐藏「Try Campaign Manager」等推广内容",
      ],
    },
  },
  {
    version: "v2.5",
    why: {
      en: "Sift now cleans up your profile and My Network pages too, not just the feed and job search.",
      zh: "Sift 现在也能清理个人主页和「我的人脉」页面，不只是 Feed 和求职搜索。",
    },
    changes: {
      en: [
        'Profile page: hide right sidebar (ads, "People you may know", "You might like")',
        "Profile page: hide Analytics section (profile views, impressions, search appearances)",
        "My Network page: hide Promoted ads in sidebar",
        'My Network page: hide "Need a 30 second break?" game promotions',
        'New "Profile Page" section in popup with dedicated toggle',
        "Poll filter: hide LinkedIn polls from your feed",
        "New user onboarding: welcome toast on first install",
      ],
      zh: [
        "个人主页：隐藏右侧栏（广告、「你可能认识」、「你可能喜欢」）",
        "个人主页：隐藏 Analytics 区域（主页浏览、曝光、搜索出现次数）",
        "「我的人脉」页面：隐藏侧栏推广广告",
        "「我的人脉」页面：隐藏「来玩 30 秒小游戏」推广",
        "弹窗新增「Profile Page」区域，带独立开关",
        "投票过滤：隐藏 LinkedIn 投票帖",
        "新用户引导：首次安装后显示欢迎提示",
      ],
    },
  },
  {
    version: "v2.3",
    why: {
      en: "Keyword filtering, icon badge, and a proper build system. Sift is now open source.",
      zh: "关键词过滤、图标徽章、正式构建系统。Sift 现已开源。",
    },
    changes: {
      en: [
        "Feed keyword filter: define custom keywords to hide matching posts",
        "Extension icon badge: filtered/flagged count shown on the Sift icon",
        "SPA navigation: instant detection via History API (no more 1s polling delay)",
        "ES Modules + esbuild: source in src/, bundled to IIFE for Chrome extension",
        "Automated tests: 23 test cases with vitest",
        "Open source under MIT license",
      ],
      zh: [
        "Feed 关键词过滤：自定义关键词隐藏匹配帖子",
        "扩展图标徽章：在 Sift 图标上显示过滤/标记数量",
        "SPA 导航优化：通过 History API 即时检测（不再有 1 秒轮询延迟）",
        "ES Modules + esbuild：源码在 src/，打包为 IIFE 供 Chrome 扩展使用",
        "自动化测试：23 个测试用例，使用 vitest",
        "以 MIT 协议开源",
      ],
    },
  },
  {
    version: "v2.2",
    why: {
      en: "Reliability and code quality. Sift now survives SPA navigation without a manual refresh.",
      zh: "可靠性和代码质量提升。Sift 现在在 SPA 导航后自动恢复，无需手动刷新。",
    },
    changes: {
      en: [
        "SPA navigation fix: Sift re-activates automatically when navigating back to the feed",
        "Shared defaults: single source of truth across all scripts",
        "Stats batching for job scans (fewer storage writes)",
        "Jobs panel shortcut changed from Ctrl+Shift+J to Ctrl+Shift+S (avoids DevTools conflict)",
        "Popup stats refresh updates in-place instead of rebuilding DOM",
        "Magic numbers extracted to named constants for easier tuning",
      ],
      zh: [
        "SPA 导航修复：从其他页面返回 feed 时 Sift 自动恢复",
        "共享默认值：所有脚本使用统一的配置源",
        "求职扫描统计批处理（减少存储写入）",
        "求职面板快捷键从 Ctrl+Shift+J 改为 Ctrl+Shift+S（避免 DevTools 冲突）",
        "弹窗统计刷新改为原地更新，不再重建 DOM",
        "魔法数字提取为命名常量，便于调优",
      ],
    },
  },
  {
    version: "v2.1",
    why: {
      en: "Mute and Unfollow now live right on every post.",
      zh: "Mute 和 Unfollow 按钮现在直接显示在每条帖子上。",
    },
    changes: {
      en: [
        "Inline Mute & Unfollow buttons on every post, no more hunting for the ... menu",
        "Search your keyword rules from the popup",
        "Simplified popup: removed float toggles, split into clearer sections",
        "Narrowed job search scope to search results page for a more focused experience",
        "Fixed hidden cards not reappearing when toggling hideFiltered off",
      ],
      zh: [
        "每条帖子上直接显示 Mute 和 Unfollow 按钮，不用再找 ... 菜单",
        "弹窗中可搜索关键词规则",
        "简化弹窗：移除浮动开关，分区更清晰",
        "收窄求职页面范围至搜索结果页，体验更聚焦",
        "修复切换 hideFiltered 时隐藏卡片不重新显示的问题",
      ],
    },
  },
  {
    version: "v2.0",
    why: {
      en: "LinkedIn isn't just job search. Your feed is half ads too. Why not clean up both?",
      zh: "LinkedIn 不只有求职页面，你的 feed 也是一半广告。为什么不一起清理？",
    },
    changes: {
      en: [
        "Feed cleanup: hide ads/suggested/recommended posts, mute keywords, one-click unfollow",
        "Popup redesign: Controls, Stats, and Data tabs replace the floating panel",
        "Removed mute-person feature in favor of unfollow. Keyword muting kept for spam filtering.",
        "Stats tracking: daily and all-time counts for all filter actions",
      ],
      zh: [
        "Feed 清理：隐藏广告、推荐、建议帖子，关键词屏蔽，一键取消关注",
        "弹窗重新设计：Controls、Stats、Data 标签页取代浮动面板",
        "移除了屏蔽人功能，改用取消关注。保留关键词屏蔽用于过滤垃圾内容。",
        "统计追踪：所有过滤操作的每日和累计计数",
      ],
    },
  },
  {
    version: "v1.0",
    why: {
      en: "LinkedIn search shows everything: reposted, applied, no-sponsor. Why not flag them automatically?",
      zh: "LinkedIn 搜索什么都显示：已转发、已申请、不赞助签证。为什么不自动标记呢？",
    },
    changes: {
      en: [
        "Auto-scan LinkedIn job cards and flag Reposted, Applied, No Sponsor, Unpaid",
        "Skip lists for companies and title keywords, with batch import/export",
        "Draggable frosted-glass panel with dim mode for filtered cards",
      ],
      zh: [
        "自动扫描 LinkedIn 职位卡片，标记 Reposted、Applied、No Sponsor、Unpaid",
        "公司和职位关键词屏蔽列表，支持批量导入导出",
        "可拖动的毛玻璃面板，淡化模式让已标记卡片变暗",
      ],
    },
  },
];
