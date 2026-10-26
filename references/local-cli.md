# 本地命令与产物

本技能脚本使用精确锁定的 `pele@1.10.0`。它是本地辅助接口；官方 npm 包只提供库 API，没有 `bin` 字段。

## 安装与路径

在技能目录执行，或者使用绝对脚本路径；依赖解析相对于脚本所在目录，文件输入输出相对于当前工作目录。Node 20+，首次缺少依赖时：

```sh
npm ci --ignore-scripts --no-audit --no-fund
node scripts/render.mjs --help
```

使用锁文件恢复，不把 `latest`、`@1`、`^1.10.0` 当作复现版本。应用项目需要自己的精确依赖及锁文件；技能安装不代表项目已集成 Pele。

## 文件渲染

```sh
node scripts/render.mjs source.mmd output.svg
node scripts/render.mjs source.mmd output.html --theme auto --lang zh-CN
node scripts/render.mjs source.mmd narrow.svg --max-width 320
node scripts/render.mjs source.mmd fixed.svg --fixed --keep-direction
node scripts/render.mjs source.mmd diagram.svg --id-prefix chapter2-figure3
```

`output.svg` 内嵌主题 CSS，`output.html` 内嵌同一 SVG，不加载 CDN。默认主题 auto，另有 light/dark；HTML 是静态预览，不包含动态 mount、编辑器或缩放逻辑。SVG/CSS 面向现代浏览器；用于 PNG、PDF 或文档工具前要验证 CSS 变量支持并处理静态颜色，见 [主题与导出](theming-and-layout.md)。

| 参数 | 行为 |
| --- | --- |
| `--max-width N` | 让布局按指定宽度适配；不保证结果完全不溢出 |
| `--keep-direction` | 关闭默认的窄屏自动换向 |
| `--fixed` | `responsive: false`，固定自然像素尺寸 |
| `--font FAMILY` / `--font-size N` | 布局测量字体与字号；Node 仍使用估计宽度 |
| `--lang TAG` | HTML 文档语言，使用 BCP 47，如 zh-CN/en；默认 und（未指定），按主要标签语言设置 |
| `--id-prefix ID` | 仅字母数字、`-`、`_`；脚本附加代码块序号 |
| `--allow-links` / `--allow-images` | 显式启用；默认二者均关闭 |
| `--timeout-ms N` | worker 总渲染预算，默认 10000，最大 120000；超时终止 worker |
| `--force` | 覆盖指定输出，按现有授权使用；默认保护已有文件 |

源文件最多 2 MB；Pele 自身仍保留 50,000 字符源码限制、4,000,000 字符 SVG 限制和 flowchart/agentflow 的 5,000 边限制。文件读取上限不是引擎源码上限。

默认 `idPrefix` 由输入文件绝对路径的哈希派生，同一个源文件多次插入同一页面时仍必须手动给出不同前缀。产物不保存原始绝对路径；JSON 回执仅用于本地工作。

## 校验 Markdown 与源文件

```sh
node scripts/render.mjs --check architecture.mmd notes.md more.md
```

`.mmd` 作为完整图解析；`.md` / `.mdown` 提取最多三空格缩进的顶层 fenced Mermaid 块。支持 backtick 和 tilde fences，并避开包在其他代码围栏中的示例。列表、引用块、MDX 等嵌套 Markdown 结构不属于此轻量提取器的完整语法；把目标图另存 `.mmd`，或用宿主已有 Markdown AST。

没有找到图或围栏未闭合会报错，不会显示“零图通过”。错误中的行号映射回 Markdown 文件。所有代码块实际执行 `render()`，不是只检查首行。校验模式不会写图像。

## 回执与失败

成功渲染：退出 0，JSON 包含 `ok: true`、`type`、`width`、`height`、`output`、`bytes`、`pele`。校验模式包含每个块的结果。失败：非零退出，包含错误代码、消息和可用的位置；保留失败证据，修复相关源文本后重跑。

Pele 的错误代码是 `unsupported-diagram`、`syntax`、`semantic`、`limit`。辅助脚本另有 `usage`、`timeout` 和文件系统错误（如 `EEXIST`）。不要把 `EEXIST` 当作渲染成功，也不要为通过而静默覆盖已有文件。

两个有意的边界：脚本不提供全量 `RenderOptions` 透传，图标、数学、配置与定制测量用 [JS API](api-and-integration.md)；脚本不生成 PNG/PDF，也不调用第三方服务。

## 自检与刷新

```sh
npm run verify
python scripts/capture_site.py --output NEW_CAPTURE_DIRECTORY
python scripts/extract_examples.py NEW_CAPTURE_DIRECTORY/site.zip NEW_EXAMPLES_FILE.json
```

刷新写入新目录，比较版本、页面覆盖和示例行为后再替换引用。捕获脚本是有限的站内内容抓取器，不会遍历外站，不会下载或执行全部 JS/CSS/字体。完整网站源码可从固定提交获取；更新策略见 [来源](sources.md)。
