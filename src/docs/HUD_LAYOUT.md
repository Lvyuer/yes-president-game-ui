# 主循环 HUD 构图规范

面向人与 AI 的主循环工作屏装配手册。构图真源：`playground/main-loop/MainLoopShell.vue` + `MainHud.vue` + `MainActions.vue` + 办公室背景。数值真源：`src/styles/tokens.css`（`--yp-hud-*`、`--yp-frame-*`、字体族）。

设计规格：`docs/superpowers/specs/2026-07-17-hud-layout-design.md`  
参考构图：工作区根目录 Oval Office HUD 参考图（约 3840×2160）。

> **定稿原则（2026-07-17 微调）：** 图标与中文/数值偏大、顶底面板偏紧凑、入口钮取小档高度；边框与内容同比例，勿只放大内容却让框变细。

## 1. 设计哲学

- **场景是主视觉。** 背景为圆厅办公室中的主角与桌面；中部留白是构图本身，不是缺内容。
- **HUD 贴边悬浮。** 顶栏与底栏贴舞台上下边缘，用渐变遮罩保证可读，不盖住主角与桌面中心。
- **质感说明书 ≠ 换肤实现。** 权力金映射到 `--yp-color-gold*`；表面仍用九宫格 PNG，禁止用纯 CSS 双边框替代材质框。

## 2. 舞台契约

- 比例：`aspect-ratio: var(--yp-hud-aspect)` → `16 / 9`
- 外黑边：`padding: var(--yp-hud-stage-pad)` → `16px`
- 背景：`object-fit: cover`；禁止非 16:9 自由拉伸舞台

## 3. 四区说明

```
┌─ Stage（16:9 + 办公室背景）─────────────────┐
│  Top HUD：资源四项（左）| 任期/中期进度（右）   │
│  Scene Viewport：场景可见区（默认空）          │
│  Bottom Dock：四钮居中（手机/发布/处理/国家）  │
└─────────────────────────────────────────────┘
```

| 区 | 职责 | 允许 | 禁止 |
|---|---|---|---|
| Stage | 16:9 舞台 | 背景 cover、描边 | 破坏比例 |
| Top HUD | 玩家四项 + 任期进度 | 资源条、小型进度框 | 大面板、长文、主入口 |
| Scene Viewport | 展示办公室 | 空、热点、极轻贴边提示 | 默认塞面板/卡片挡主角 |
| Bottom Dock | 四个总统级入口 | 四钮居中一行 | 超过 4 个主入口、全宽铺满 |

### z-index

| 层 | z |
|---|---|
| 背景 | 0 |
| Scene Viewport | 1 |
| Top / Dock | 2 |
| 浮层（手机等） | ≥10 |

危机 Feed 若加入：只能贴边或浮层，不得占舞台中心。

## 4. Layout Token 表

| Token | 值 | 用途 |
|---|---|---|
| `--yp-hud-aspect` | `16 / 9` | 舞台比例 |
| `--yp-hud-stage-pad` | `16px` | 舞台外黑边 |
| `--yp-hud-safe-x` | `18px` | 左右安全边 |
| `--yp-hud-safe-top` | `14px` | 顶栏上边距 |
| `--yp-hud-safe-bottom` | `18px` | 底栏下边距 |
| `--yp-hud-top-gap` | `12px` | 资源条与任期框间距 |
| `--yp-hud-top-time-min-w` | `340px` | 任期框最小宽 |
| `--yp-hud-top-time-max-w` | `460px` | 任期框最大宽 |
| `--yp-hud-top-time-min-h` | `168px` | 任期框最小高（与资源条齐平） |
| `--yp-hud-top-fade` | 顶栏渐变 | 顶栏可读遮罩 |
| `--yp-hud-dock-max-w` | `920px` | Dock 最大宽 |
| `--yp-hud-dock-w` | `84%` | Dock 相对宽 |
| `--yp-hud-dock-gap` | `12px` | 四钮间距 |
| `--yp-hud-dock-btn-min-h` | `176px` | 入口钮最小高（小档） |
| `--yp-hud-dock-pad-top` | `6px` | Dock 上内边距 |
| `--yp-hud-dock-fade` | 底栏渐变 | 底栏可读遮罩 |
| `--yp-hud-break-narrow` | `900px` | 文档断点（media 用字面量） |

宽屏 Dock 宽度：`min(var(--yp-hud-dock-max-w), var(--yp-hud-dock-w))`。

## 5. 视觉尺度（主循环定稿）

这些尺寸写在 playground / 组件样式中，与 Layout Token 配套；改一边时勿只放大内容却不调框。

### 5.1 顶栏 · 资源条

| 项 | 定稿 |
|---|---|
| 条最小高 | `168px`（与任期框齐平） |
| 资源图标 | `96×96px` |
| 标签 | 宋体 `1.35rem`，在数值**上方** |
| 数值 | `--yp-font-data`（Inter Bold）`2.35rem` |
| 趋势/涨跌 | **不要**（无箭头、无 delta） |
| 外框 | `--yp-frame-resource-bar-width: 22px 30px` |

### 5.2 顶栏 · 任期框

| 项 | 定稿 |
|---|---|
| 结构 | 居中标题 → 沙漏 + 中期文案 → 细 pill 进度条 |
| 标题 | 宋体 `1.65rem` |
| 中期行 | 沙漏约 `1.05rem` + 文案 `1rem` |
| 进度 | 自定义薄轨（高约 `8px`），**不用** `GameProgressBar` |
| 外框 | `--yp-frame-resource-item-width: 20px` |

### 5.3 底栏 · 入口钮

| 项 | 定稿 |
|---|---|
| 钮最小高 | `176px`（`--yp-hud-dock-btn-min-h` / `GameFeatureButton`） |
| 图标 | `88×88px`（`MainActions` 覆盖） |
| 中文标题 | `1.35rem` |
| 英文副标题 | `0.85rem`（拉丁大写间距） |
| 内边距 | 约 `22px 14px 18px`（为 88px 图标留空） |
| 外框 | `--yp-frame-button-width: 34px` |

### 5.4 字体

| 用途 | Token / 字体 |
|---|---|
| 中文标题与标签 | `--yp-font-serif` → Noto Serif SC |
| 数值 | `--yp-font-data` → Inter Bold（`.yp-data`） |
| 英文副标题 | `--yp-font-latin` → Inter |

加载：`src/styles/fonts.css`（`@fontsource/noto-serif-sc`、`@fontsource/inter`）。

### 5.5 九宫格边框（主循环相关）

| Token | width（显示尺度） | 说明 |
|---|---|---|
| `--yp-frame-button-width` | `34px` | 入口大钮 |
| `--yp-frame-resource-bar-width` | `22px 30px` | 资源条 |
| `--yp-frame-resource-item-width` | `20px` | 任期框 |
| `--yp-frame-panel-width` | `32px` | 通用面板 |

约定：`border-width` ≤ `slice`；**width 只控制显示粗细，不随内容自动变粗。** 内容变大时需手动加粗框，否则框会显得过细。

## 6. 断点

`@media (max-width: 900px)`：

- Top HUD：单列
- Bottom Dock：`2×2`；窄屏宽度可继续用现有 `min(420px, 92%)`（未收 Token）

## 7. 质感映射

| 概念 | Token |
|---|---|
| 权力金 | `--yp-color-gold` / `--yp-color-gold-bright` |
| 主文字 | `--yp-color-text-main`（舞台可覆写象牙） |
| 次要文字 | `--yp-color-text-muted` |
| 面板表面 | 九宫格 frame + `--yp-color-surface*` |
| 顶/底可读 | `--yp-hud-top-fade` / `--yp-hud-dock-fade` |

禁止另起平行色板；禁止默认全屏扫描线网格。

## 8. AI 禁令

1. 不要把面板/卡片默认塞进 Scene Viewport 中心。
2. 不要把 `DashboardShell` 当作办公室主循环构图真源。
3. 不要用纯 CSS 双边框 / `::after` 金线替代九宫格材质框。
4. 不要硬编码 HUD 边距；使用 `--yp-hud-*`（`900px` media 除外）。
5. 不要在主循环默认启用全屏 CRT/扫描线叠加。
6. 不要给资源条加趋势箭头 / delta；数值与标签上下叠即可。
7. 不要用 `GameProgressBar` 替换任期 pill 进度。
8. 不要在「恢复大图标/大字」时顺带把顶栏面板、Dock 钮整体再放大一档；图标字号与面板高度可独立。

## 9. 验收清单

- [ ] 1920×1080：16:9 完整，办公室中心可见，顶底不重叠
- [ ] ≤900px 或 1366 窄窗：顶栏单列、底栏 2×2，四钮可点
- [ ] 中部默认无面板挡主角/桌面
- [ ] 资源：大图标 + 上标签下数值，无涨跌箭头
- [ ] 任期：居中标题 + 沙漏行 + 细 pill；与资源条同高约 168px
- [ ] Dock：钮高 176px、图标约 88px，四钮居中不铺满
- [ ] `npm run check:hud` 通过
- [ ] 本文档可独立指导生成空壳主屏

## 10. 次级屏尺度（Dock 四入口）

与主 HUD 定稿对齐：**大字号、边距贴 safe、数值用 Inter Bold**；三全屏信息架构以工作区根目录 `ref-publish.png`、`ref-inbox.png`、`ref-nation.png` 为结构真源，材质仍跟主 HUD。

实现文件：`playground/main-loop/PublishScreen.vue`、`InboxScreen.vue`、`NationScreen.vue`、`PhoneOverlay.vue`。

### 10.1 全屏次级页（发布 / 处理 / 国家）

| 项 | 定稿 |
|---|---|
| 屏内边距 | `14px 18px 18px`（对齐 `--yp-hud-safe-top` / `--yp-hud-safe-x` / `--yp-hud-safe-bottom`） |
| 屏内 gap | `14px` |
| 英文眉标 | `0.85rem`（`--yp-font-latin`） |
| 中文页标题 | `1.55rem`（`--yp-font-serif`） |
| 列表/方向/指标行 padding | `16px 18px` |
| 次要说明 | `0.9rem` |
| 正文/摘要 | `1.05rem`，行高约 `1.7` |

专项：国家侧栏指标主值用 `--yp-font-data`；趋势/画布高度约 `208px`（网络图 `252px`）。国家侧栏 delta 保留。

### 10.2 手机浮层

| 项 | 定稿 |
|---|---|
| 设备宽 | `min(420px, 90%)` |
| App 图标 | `56×56px` |
| 状态栏字 | `0.85rem` |
| 布局 | 居中浮层，z-index ≥10；**不全屏铺开** |

窄屏断点仍用各文件内 `@media (max-width: 980px)` 单列，未收 Token。

## 11. 场景视频层（首版：手机）

主界面背景由 [`SceneBackdrop.vue`](../../playground/main-loop/SceneBackdrop.vue) 驱动，状态机见 [`MainLoopPage.vue`](../../playground/pages/MainLoopPage.vue)。

| 模式 | 视频 | 行为 |
|---|---|---|
| `idle` | `assets/video/idle-*.mp4`（可选） | 多数时间静图；约 3–8s 后随机插播一条，播完回静图 |
| `phone-start` | `phone-start.webm` | 点手机立刻开浮层，并行播一次 |
| `phone-hold` | （定格 Start 末帧） | 手机 UI 打开期间 |
| `phone-end` | `phone-end.webm` | 关浮层后播一次，再回 `idle` |

资源目录：`playground/main-loop/assets/video/`（见该目录 `README.md`）。缺文件时回退 `oval-office.png`，不阻塞 UI。

**分辨率：** 静图 `oval-office.png` 为 5504×3072；视频推荐 3840×2160（16:9），首帧须与静图同构图。

**HUD**：手机打开时顶栏保留、底栏 Dock 隐藏；`phone-end` 期间 Dock 仍隐藏。发布/处理/国家次级屏首版不改背景视频。
