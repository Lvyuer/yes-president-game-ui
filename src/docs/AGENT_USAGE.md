# Yes President Game UI — Agent 使用手册

面向后续 Agent 与业务项目的组件库使用说明。视觉真源为金边暗纹九宫格材质线。

## 安装与导入

本地开发（树懒国 monorepo 内）：

```json
{
  "dependencies": {
    "yes-president-game-ui": "file:../packages/yes-president-game-ui"
  }
}
```

```ts
import {
  GamePanel,
  GameFeatureButton,
  GameButton,
  GameIconButton,
  GameProgressBar,
  GameNotice,
  GameResourceBar,
  DashboardShell,
  ActionGrid,
  NoticeStack,
} from 'yes-president-game-ui';
import 'yes-president-game-ui/style';
```

## 页面组合语法

### 主循环工作屏（沉浸式真源）

办公室主界面以场景为中心、HUD 贴边。构图与 Token 见 [HUD_LAYOUT.md](./HUD_LAYOUT.md)。实现参考 playground：`MainLoopShell` + `MainHud` + `MainActions`。

**不要**把下面的 `DashboardShell` 当作办公室主循环构图真源——它是文档站「页面语法」演示壳（无场景沉浸）。

### DashboardShell — 文档站页面语法壳（非沉浸式主循环）

区域：顶部资源栏、主功能入口、核心信息面板、右侧通知区、底部操作区。

```vue
<DashboardShell :resources="resources" :actions="actions" :notices="notices">
  <GamePanel title="顾问建议" subtitle="ADVISOR">
    <p>正文必须是 DOM。</p>
    <GameProgressBar :value="64" label="支持率" />
  </GamePanel>
  <template #footer>
    <GameButton>确认决策</GameButton>
  </template>
</DashboardShell>
```

### ActionGrid — 主功能入口区

使用 `GameFeatureButton`，每个按钮含独立图标、中文标题、英文副标题。

### AdvisorPanel / ReportPanel

使用 `GamePanel`。标题、正文、进度条必须是 DOM；装饰线、边框只作材质层。

### NoticeStack — 通知区

使用 `GameNotice`，支持 `info | warning | danger | success`。

## 组件 API 速查

### GamePanel

| Prop | 类型 | 默认 |
|------|------|------|
| title | string | — |
| subtitle | string | — |
| size | large \| medium \| compact \| notice | medium |
| framed | boolean | true |

Slots: `header`, default, `footer`

### GameFeatureButton

| Prop | 类型 | 默认 |
|------|------|------|
| icon | string | — |
| label | string | 必填 |
| subtitle | string | — |
| disabled | boolean | false |

内置图标名：`action`, `document`, `chart`, `play`, `close`。也可传入自定义 URL。

材质：`功能按钮边框.png` 九宫格。最小尺寸 240×160px。

### GameButton

| Prop | 类型 | 默认 |
|------|------|------|
| variant | primary \| secondary \| danger \| success | primary |
| disabled | boolean | false |

材质：`button-frame-primary` / `button-frame-disabled`。不要用于 hero/feature 大按钮。

### GameIconButton

| Prop | 类型 | 默认 |
|------|------|------|
| icon | string | 必填 |
| label | string | 必填（aria-label） |
| disabled | boolean | false |

固定 48×48，不做九宫格。

### GameProgressBar

| Prop | 类型 | 默认 |
|------|------|------|
| value | number | 必填 |
| max | number | 100 |
| label | string | — |
| tone | success \| warning \| danger \| neutral | neutral |
| showThumb | boolean | true |

### GameNotice

| Prop | 类型 | 默认 |
|------|------|------|
| title | string | 必填 |
| message | string | — |
| tone | info \| warning \| danger \| success | info |

### GameResourceBar

| Prop | 类型 |
|------|------|
| items | `{ id, label, value, icon? }[]` |

## 资产 Manifest

机器可读清单：`src/assets/manifest.json`。每条资产含 nineSlice、safeArea、minSize、forbiddenUses。

当前高清素材已入库（slice / width 以 `tokens.css` 为准；下列 width 为显示尺度）：

- `button-frame-default` — slice `220`，width `34px`，用于 **GameFeatureButton**
- `button-frame-primary` — slice `210 230`，width `22px 28px`，用于 **GameButton**
- `button-frame-disabled` — slice `200`，width `20px 24px`，独立于主按钮
- `panel-frame-default` — slice `180`，width `32px`，用于 **GamePanel**
- `resource-bar-frame` — slice `105 170`，width `22px 30px`，用于 **GameResourceBar**
- `resource-item-frame` — slice `180`，width `20px`，用于主循环任期框等
- `notice-frame-default` — slice `190 170`，width `28px 24px`，用于 **GameNotice**
- `input-frame-default` — slice `180 190`，width `26px 28px`，用于 **GameInput**
- `select-frame-default` — 使用无箭头基础框；箭头和列表顶部凸起为独立覆盖层
- `progress-track-default` — slice `110 160`，width `12px 26px`，用于 **GameProgressBar / GameSlider**
- `progress-thumb-default` — 固定尺寸滑块按钮
- `title-divider-default` / ornament — 标题分割装饰线，用于 **GameTitleDivider / GamePanel**
- `icon-button-base-default` — 圆形按钮底座，用于 **GameIconButton**

主循环资源条：标签在上、数值在下；**不要**加趋势箭头。任期进度用细 pill，不用 `GameProgressBar`。详见 [HUD_LAYOUT.md](./HUD_LAYOUT.md) §5。

### GameTitleDivider

| Prop | 类型 | 默认 |
|------|------|------|
| stretch | boolean | true |

| Prop | 类型 | 默认 |
|------|------|------|
| modelValue / v-model | number | 0 |
| min / max / step | number | 0 / 100 / 1 |
| label | string | — |
| disabled | boolean | false |
| showValue | boolean | true |

### GameInput

| Prop | 类型 | 默认 |
|------|------|------|
| modelValue / v-model | string | '' |
| label | string | — |
| placeholder | string | — |
| hint | string | — |
| type | string | text |
| disabled | boolean | false |
| readonly | boolean | false |

### GameSelect

| Prop | 类型 | 默认 |
|------|------|------|
| modelValue / v-model | string | '' |
| options | `{ value, label, disabled? }[]` | 必填 |
| label | string | — |
| placeholder | string | 请选择 |
| disabled | boolean | false |

## 组件库文档站（Playground）

形态对齐 [animal-island-vue 文档站](https://guokaigdg.github.io/animal-island-vue/#/form)：左侧导航 + 示例区块 + 代码折叠 + API 表。

```bash
cd packages/yes-president-game-ui
npm install
npm run dev
```

打开 `http://localhost:5174/#/overview`。

常用路由：

- `#/overview` 总览
- `#/feature-button` 功能按钮
- `#/panel` 面板
- `#/dashboard` 主界面壳

## 与 yes-president-ui 的关系

- `yes-president-ui`：现代黑白政治传播风（Yp* 组件），**不改动**
- `yes-president-game-ui`：金边材质游戏 UI（Game* 组件），本库

两库可并存，按场景选用。
