# 资产入库流水线

每收到一张新 PNG，按以下顺序处理。

## 1. 原始入库

将原图放入 `src/assets/raw/<name>-original.png`，不破坏原图。

## 2. 检查图片信息

```python
from PIL import Image

im = Image.open("asset.png").convert("RGBA")
alpha = im.getchannel("A")
print("size", im.size)
print("alpha extrema", alpha.getextrema())
print("alpha bbox", alpha.getbbox())
```

检查项：

- 图片尺寸
- 是否有 alpha 通道
- alpha bbox（真实内容边界）
- 四周透明边距是否足够
- 是否有文字、图标、示例内容被烘焙
- 边缘是否有脏边、白边、黑边

若背景为纯黑且无 alpha，对近黑像素做 keying（R/G/B < 12 → alpha 0）。

## 3. 裁切

- 按 alpha bbox 裁切
- bbox 外保留 16–32px 透明安全边距
- 保存为 `src/assets/themes/default/<category>/<name>.png`

## 4. 分类

| 类型 | 目录 | 拉伸方式 |
|------|------|----------|
| panel-frame | frames/ | 九宫格 |
| button-frame | frames/ | 九宫格 |
| texture-tile | textures/ | 平铺 |
| divider | dividers/ | 固定或横向拉伸 |
| icon | icons/ | 固定尺寸 |
| icon-button | icons/ | 固定尺寸 |
| reference-only | raw/ | 不入组件 |

## 5. 调参

在 playground 或临时 HTML 页测试至少三种尺寸：

- 大面板：600 × 420
- 中卡片：360 × 300
- 通知条：320 × 120
- 大功能按钮：360 × 236
- 窄按钮：220 × 140

调 `border-image-slice` 直到：

- 四角不变形
- 四边不断裂
- 中央内容区无裂缝

## 6. 写入 Manifest

在 `src/assets/manifest.json` 新增条目，包含：

- id, file, type, size, alphaBBox
- nineSlice (top/right/bottom/left/fill/repeat)
- safeArea, minSize
- usage, componentTargets, forbiddenUses

同步更新 `src/styles/tokens.css` 中的 slice 变量（若为新主题框）。

## 7. 抽象组件

- PNG 放 `::after` 装饰层
- 文案、图标、状态由 Vue/CSS 管理
- 不要把完整 UI 截图当组件背景

## 8. 验收

- playground 增加示例
- 更新 AGENT_USAGE.md
- 截图验证三种尺寸

## Agent 执行清单

1. raw 入库
2. alpha 检查
3. 裁切
4. 分类
5. 最小测试页
6. 三种尺寸测试
7. 调整 border-image-slice
8. 写入 manifest
9. 抽象 Vue 组件
10. playground 示例
11. 截图验证
12. 更新 AGENT_USAGE.md
