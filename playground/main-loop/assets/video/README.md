# 主循环场景视频

将生成好的成片放到本目录，按下列文件名命名（优先 `.webm`，也可 `.mp4`）：

| 文件 | 用途 |
|---|---|
| `idle-*.mp4` | 主界面 ambient 随机插播（**当前关闭**：`AMBIENT_IDLE_ENABLED = false`）；平时用静图 IDLE |
| `idle-signing-documents.mp4` | **港口罢工案例专用**：幕僚呈递→定格→退场（`advisor-arrive/hold/leave`） |
| `idle-homeless-intruder.mp4` | **开场专用**：进主循环约 2s 后播放；播完才推危机（`intro-intruder`） |
| `idle.webm` / `idle.mp4` | 可选单条 ambient（与 `idle-*` 一并纳入随机池） |
| `phone-start.webm` | 点击手机：掏手机过渡（约 4s，首帧对齐 IDLE） |
| `phone-end.webm` | 关闭手机：收手机过渡（约 4s，尾帧对齐 IDLE） |

缺文件时自动回退 `../oval-office.png` 静图，不阻塞 UI。

**分辨率与构图（重要）：**

| 资产 | 推荐尺寸 | 比例 |
|---|---|---|
| `oval-office.png`（静图真源） | 5504×3072 | ≈16:9 |
| 场景视频（idle / phone-start / phone-end） | **3840×2160** 或与静图同尺寸 | **严格 16:9** |

视频首帧/尾帧必须与 `oval-office.png` 同机位、同取景；否则切换时会感到缩放或「被压扁」。导出时优先用静图作首帧锚点（见 Transition 提示词文档）。

**编码要求（重要）：** 请导出 **H.264 (avc1) + AAC**。浏览器对 **HEVC/H.265 (hvc1)** 支持不稳定，会导致“有声音/时间在走但画面全黑”。推荐：`mp4` H.264，或 `webm` VP9。

### 对齐测试（开发）

在本地打开：

`http://localhost:5174/?scene-debug=1#/main-loop`

右下角会出现调试面板：

1. 选 `phone-start` → 点 **首帧** → 视图选 **叠加**、透明度 **50%**
2. 办公桌、地毯、门框边缘应无重影；有双线/错位 = 需重做视频或重导首帧
3. `phone-end` 用 **尾帧** 与 IDLE 静图对比；`idle` 循环则对比首尾帧

合格标准：静止参照物（桌沿、地毯纹、门框）偏移 ≤ 约 1 像素；人物可有 AI 微动，但背景不能漂。

提示词与首尾帧规范见仓库根目录 `docs/video/prompts/Yes-President-Transition视频提示词.md`。
