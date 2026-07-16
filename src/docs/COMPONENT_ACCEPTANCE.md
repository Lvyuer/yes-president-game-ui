# 组件验收标准

组件进入正式库前必须通过以下检查。

## 视觉检查

- [ ] 大、中、小尺寸不破边
- [ ] 角饰不拉伸变形
- [ ] 文本不和花纹、边框、图标重叠
- [ ] 字体风格与参考图一致（宋体标题、窄体英文副标题）
- [ ] PNG 没有白边、黑边、脏边
- [ ] 内容区没有平铺裂缝

## 功能检查

- [ ] 文案可替换（DOM 文本，非烘焙 PNG）
- [ ] 图标可替换（独立 SVG/PNG）
- [ ] 支持 hover
- [ ] 支持 active/pressed
- [ ] 支持 disabled
- [ ] 支持键盘 focus（focus-visible outline）
- [ ] 按钮有 aria-label 或可读文本

## 交付检查

- [ ] 组件有 props 类型（types.ts）
- [ ] 组件有 playground 示例
- [ ] 资产有 manifest 条目（nineSlice / safeArea / forbiddenUses）
- [ ] 文档说明 PNG 是九宫格、平铺还是固定尺寸
- [ ] `src/index.ts` 真实导出，playground 从本地 import

## 首版组件状态

| 组件 | 材质 | 状态 |
|------|------|------|
| GameFeatureButton | button-frame 九宫格 | 已验收（待视觉截图） |
| GamePanel | panel-frame 九宫格 | 已验收（待视觉截图） |
| GameNotice | panel-frame 压缩 | 已验收 |
| GameResourceBar | panel-frame 窄条 | 已验收 |
| GameButton | CSS 临时边框 | 临时，等矮按钮框 PNG |
| GameIconButton | 占位 SVG | 已验收 |
| GameProgressBar | CSS 轨道 | 临时，等进度条 PNG |

## 禁止事项

- 不要把完整 UI 截图直接当组件
- 不要把带文字 PNG 当按钮
- 不要让 AI 自己发明字体和边框规则
- 不要把装饰线塞进标题背景里
- 不要用大面板框强行做所有小按钮
- 不要把资产路径写死在业务页面
