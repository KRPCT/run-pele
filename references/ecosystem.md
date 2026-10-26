# CLI、skill 与 MCP

以下是 2026-10-26 核验的项目接口与版本。官方事实来自仓库源码、npm 元数据和项目文档；社区工具的描述表示源码或文档确认，未表示完整运行认证。

## 官方与本地路径

[obsidianmd/pele](https://github.com/obsidianmd/pele) 提供 JavaScript 库。核验版本 1.10.0 要求 Node 20+，没有运行时依赖，也没有 CLI `bin` 字段。Run Pele 直接调用该库，提供本地文件渲染与校验脚本；它不是官方 CLI。

## 相关社区项目

| 项目 | 功能 | 核验版本与边界 |
| --- | --- | --- |
| [jpmanson/pele-skill](https://github.com/jpmanson/pele-skill) | 专用 skill、SVG/HTML wrapper、图型 catalog、smoke、自定义颜色导出 | skill 0.4.0，Pele 1.6.0；3 stars、Skills 搜索 7 installs，采用信号较少 |
| [ial32/pele-cli](https://github.com/ial32/pele-cli) | render、check、types、info、extract、themes、init、watch、playground；附 skill | package 0.1.0，Pele 1.8.0，Node 22+；0 stars、1 install；`pele-cli/latest` npm 元数据返回 404，不能假定 `npx pele-cli` 可用 |
| [sheurich/agent-skills 的 pele](https://github.com/sheurich/agent-skills/tree/main/skills/pele) | Shell wrapper、Markdown 校验、SVG/HTML/JSON、本地缓存 | Pele 1.6.0；0 stars；Skills 安装量未核实；Shell 入口需考虑平台差异 |
| [nicobailon/visual-explainer](https://github.com/nicobailon/visual-explainer) | HTML 图解/幻灯片 skill，vendored Pele，本地 stdio MCP | npm 0.14.0；10,630 stars；Skills 安装量未核实；用途比单图渲染更广 |

统计会变化。少量 stars/install 只能说明使用信号不足，不能独立证明代码质量。选择时检查当前版本、依赖、接口和真实需求；不要把所有候选作为默认依赖。

可通过 [Skills CLI](https://github.com/vercel-labs/skills) 的 `find pele`、`find mermaid` 查询。已发现专用标识 `jpmanson/pele-skill@pele` 与 `ial32/pele-cli@pele`；安装前再次检查来源。运行 Skills CLI 时满足它自己的 Node 版本要求，不要把 Pele 的 Node 20+ 要求套到搜索工具。

## MCP 的实际接口

官方文档、仓库树与发布包中未发现官方 Pele MCP。公开检索也未确认独立的专用服务；这是有范围的调查结论，不是对全球所有项目的断言。同名分子模拟 PELE 或 `mcpele` 不属于 Mermaid 渲染生态。

Visual Explainer 提供已确认的相关本地 stdio 服务：

- `visual_explainer_prepare` 返回可视化准备流程，不写文件。
- `visual_explainer_render_html` 接收完整 HTML 并写入配置输出目录，默认 `open: false`。
- 提供 skill、references、kit 和命令模板资源与 prompts。

启动入口为包内的 `visual-explainer-mcp`，或 `node <checkout>/plugins/visual-explainer/mcp/server.mjs`。它不启动 HTTP 服务；输出目录受项目的路径与 symlink 策略约束，可由 `VISUAL_EXPLAINER_OUTPUT_DIR` 配置。

这不是直接接收 Mermaid 源码并返回 SVG 的官方接口。本仓库不提供 MCP 服务，也不自动安装该候选。需要 MCP 集成时再核对当前 tool schema 和宿主配置，并单独验证实际调用。

## 核验提交

- Pele：`4eff76f98c73b6817800a05773517f35832e4e92`
- jpmanson/pele-skill：`50ffbb57f3c4cd7b9f96f7bb02c69c70e6371973`
- ial32/pele-cli：`44eed0cd015afe89615d97464fb97c14876007e8`
- sheurich/agent-skills：`15e5a634bf79d2af442bfddfa54310271b337f45`
- nicobailon/visual-explainer：`5f378868e0ea745a6284b51e710c390f0c76f72c`
