# Yes President Game UI

金边暗纹材质 Vue 3 组件库，面向《Yes President》游戏界面。

与 `yes-president-ui`（现代黑白风）独立并存。

## 在线预览

**[https://lvyuer.github.io/yes-president-game-ui/#/overview](https://lvyuer.github.io/yes-president-game-ui/#/overview)**

## 快速开始

```bash
npm install
npm run dev          # 本地文档站 @ :5174
npm run build:lib    # 构建组件库
npm run build:docs   # 构建 GitHub Pages 文档站 → playground-dist
```

文档站路由示例：`/#/overview`、`/#/feature-button`、`/#/panel`、`/#/dashboard`。

## 部署

文档站当前通过 `gh-pages` 分支发布（`npm run build:docs` 后推送 `playground-dist` 内容）。

启用 GitHub Actions 自动部署：

1. 授权 workflow 权限：`gh auth refresh -h github.com -s workflow`
2. 推送 `.github/workflows/deploy-pages.yml`：`git push origin main`
3. 仓库 **Settings → Pages → Build and deployment** 选 **GitHub Actions**

## 文档

- [AGENT_USAGE.md](src/docs/AGENT_USAGE.md)
- [ASSET_PIPELINE.md](src/docs/ASSET_PIPELINE.md)
- [COMPONENT_ACCEPTANCE.md](src/docs/COMPONENT_ACCEPTANCE.md)

## 首批资产

- `panel-frame.png` (v2) — 通用大面板框（910×340，slice 48）
- `button-frame.png` (v2) — 深色功能按钮框（820×263，slice 93）

详见 `src/assets/manifest.json`。
