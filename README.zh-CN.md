# Run Pele

**使用 Pele 将 Mermaid 渲染为 SVG 和独立 HTML。** 这个仓库提供可复用 skill、本地命令行脚本、Markdown 图表校验，以及带来源的示例库。渲染在 Node.js 中完成，不需要浏览器。

[English](README.md) · [技能入口](SKILL.md) · [命令参考](references/local-cli.md) · [Pele 官方文档](https://pele.run/)

![由 Pele 实际渲染的文档审核流程：草稿通过审核后发布，需要修改时进入修订流程。](assets/readme/review-flow.svg)

这张图是由 Pele 生成并提交的 SVG，附有[可编辑 Mermaid 源码](examples/review-flow.mmd)。GitHub 直接展示图片；README 内不执行 Pele JavaScript。

## 快速开始

需要 Node.js 20+ 和 npm；渲染器锁定为 Pele 1.10.0。

```sh
git clone https://github.com/KRPCT/run-pele.git
cd run-pele
npm ci --ignore-scripts --no-audit --no-fund
node scripts/render.mjs examples/review-flow.mmd review.svg
node scripts/render.mjs examples/order-handoff.mmd order.html --lang zh-CN
node scripts/render.mjs --check examples/review-flow.mmd
```

本地打开 SVG 或 HTML 即可查看。脚本不上传源码、不启动服务，默认保护已有输出；需要替换时使用 `--force`。

## 安装为 skill

通过 [Skills CLI](https://github.com/vercel-labs/skills) 安装，使用该 CLI 支持的 Node 版本：

```sh
npx skills add KRPCT/run-pele --skill run-pele
```

在安装器中选择客户端和安装范围。渲染依赖缺失时，从安装后的技能目录执行 `npm ci --ignore-scripts --no-audit --no-fund`。

示例请求：

> 使用 $run-pele 绘制客户、仓库和财务的订单交接泳道图，输出 Mermaid 源码和 HTML，并校验结果。

## 展示案例：中文订单泳道图

![由 Pele 渲染的中文泳道图：客户提交订单，仓库拣货并发货，财务开具发票。](assets/readme/order-handoff.svg)

[查看源码](examples/order-handoff.mmd) · [查看 SVG](assets/readme/order-handoff.svg)

```sh
node scripts/render.mjs examples/order-handoff.mmd phone.html --max-width 320 --lang zh-CN
```

`--max-width` 用于请求布局适配，不保证自然宽度绝不超出。两张 README 图片均可运行 `npm run showcase` 重新生成，版本与尺寸记录在[图片清单](assets/readme/manifest.json)中。

## 语法、校验与集成

示例库收录来自 32 个官方示例页的 **591 个不同示例**，覆盖发布包的 **33 类规范化图型**（含诊断类型 `info`）。每个示例保留来源 URL。

```sh
node scripts/catalog.mjs
node scripts/catalog.mjs --type sequence --search critical
node scripts/catalog.mjs --type swimlane --example 1
node scripts/render.mjs --check notes.md
npm run verify
```

校验会实际渲染顶层 Mermaid 围栏，并将错误位置映射回 Markdown。验证套件覆盖全部示例的两种宽度、全部图型、错误输入、按需加载、输出保护和超时终止；没有逐图完成目视审查。范围见[验证摘要](validation/summary.json)。

| 需求 | 文档 |
| --- | --- |
| 图型选择、精确关键字、语法模式 | [语法指南](references/syntax.md) |
| SVG/HTML 文件与 Markdown 校验 | [本地命令](references/local-cli.md) |
| Node、浏览器、mount、lazy、数学 | [API 集成](references/api-and-integration.md) |
| 主题、字体、窄屏与导出 | [主题与布局](references/theming-and-layout.md) |
| 不可信输入与 Mermaid 迁移 | [安全与兼容](references/security-and-compatibility.md) |

## 常见问题

### 需要 Chrome 或 Puppeteer 吗？

生成 SVG 不需要。浏览器用于检查最终展示与真实字体布局。

### 这是官方 CLI 或 MCP 吗？

不是。本仓库是 [Pele](https://github.com/obsidianmd/pele) 的独立 skill 与本地包装脚本，不提供 MCP 服务。相关社区项目见[生态参考](references/ecosystem.md)。

### 能代替所有 Mermaid.js 功能吗？

Pele 使用自己的布局，目标语法为 [Mermaid 12.1.0](https://pele.run/compatibility)。它不保证逐像素一致，不支持 ZenUML 等外部插件；PNG/PDF 需要额外的导出与验证步骤。

### SVG 能随应用切换主题吗？

内联 SVG 可以继承 `--pele-*` 变量。本地脚本会将主题 CSS 写入独立 SVG；通过 `<img>` 加载的 SVG 不能继承页面变量。

## 许可与来源

[MIT](LICENSE)。上游示例和 Pele 保留[第三方许可](references/third-party-notices.md)，事实来源见[来源索引](references/sources.md)。由 [KRPCT](https://github.com/KRPCT) 维护。
