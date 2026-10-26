---
name: run-pele
description: 使用 Pele（pele.run / obsidianmd/pele）编写、校验和渲染 Mermaid 为 SVG 或独立 HTML，集成 Node、浏览器与按需加载，处理主题、窄屏布局和 Mermaid 迁移差异。适用于明确使用 Pele、.mmd 文件转换或需要无浏览器 SVG 渲染的任务；不用于同名分子模拟软件，也不自动替换用户指定的其他绘图工具。
---

# Run Pele

把图表需求落实为可编辑 Mermaid 源文件和经过实际渲染的产物，或把 Pele 接入已有应用。基线为 `pele@1.10.0`、Mermaid 12.1.0 语法；资料核验日期为 2026-10-26。Pele 是渲染器，不是流程执行引擎。

## 选择工作路径

| 当前任务 | 按需读取 |
| --- | --- |
| 选图、编写或修复语法 | [语法与图型](references/syntax.md)，再按需查询示例 |
| 文件输出、批量校验、CI | [本地命令](references/local-cli.md) |
| Node、浏览器、组件、按需加载、数学 | [API 与集成](references/api-and-integration.md) |
| 颜色、字体、导出、窄屏 | [主题与布局](references/theming-and-layout.md) |
| 不可信文本、已有 Mermaid 迁移、渲染故障 | [边界与诊断](references/security-and-compatibility.md) |
| 寻找已有 CLI、skill、MCP | [生态调查](references/ecosystem.md) |
| 查询原始页面、刷新知识或审查证据 | [来源与覆盖](references/sources.md) |

这些参考各自处理一个分支，无需一次通读。站点快照可按来源参考中的命令本地生成，官方源码可按固定提交获取；它们用于核查，不是默认上下文。

## 执行流程

1. 确定图要表达的关系、交付格式和目标运行环境。沿用用户指定图型与引擎。只在信息缺失会改变语义或产物时提问。
2. 根据 [syntax.md](references/syntax.md) 选择图型及精确首行。对陌生或 `-beta` 语法先读取官方示例再改写。不要把 `agentflow` 的 connector 或 tool 声明当成真实工具调用。
3. 将源文本写入 `.mmd`；在应用中保留源文本作为数据。独立节点使用稳定 ID，人类文案放在标签中。需要可访问性时添加该图型支持的 `accTitle` / `accDescr`，并核对输出。
4. 运行真正的 `render()` 或本技能命令完成校验。`detectType()` 只识别首部；`supports()` 只检查图型是否可用，二者都不能证明语法合法。
5. 检查产物的内容、关系、标签、布局和目标环境。源码通过解析不能证明数据含义正确；Node 的文本宽度估计不能代替浏览器中的字体检查。只验证本次任务涉及的路径。
6. 交付源文件、结果文件或集成变更，并说明实际验证范围。浏览器展示、PNG/PDF 转换、第三方 MCP 等只有实际运行过才能报告通过。

完成条件：用户要求的每张图或集成路径均有产物；正常输入可渲染；相关失败路径能显式报告；目标格式可读取；发现的限制已说明。

## 本地快速使用

先把命令工作目录设为本 `SKILL.md` 所在目录，输入和输出可用绝对路径。需要 Node 20+。包已存在时直接使用；缺失时运行 `npm ci --ignore-scripts --no-audit --no-fund`，按锁文件恢复依赖。脚本不会自动安装、上传或启动服务。

```sh
# 查看图型：pageType 用于示例查询，moduleType 用于 Pele 的导入/API
node scripts/catalog.mjs

# 查询一个图型；读取第 1 个示例源码
node scripts/catalog.mjs --type swimlane
node scripts/catalog.mjs --type swimlane --example 1

# 查找涉及某语法的示例（最多返回 12 项）
node scripts/catalog.mjs --type flowchart --search classDef

# 渲染或校验
node scripts/render.mjs diagram.mmd diagram.svg
node scripts/render.mjs diagram.mmd diagram.html --theme dark --lang zh-CN
node scripts/render.mjs --check diagram.mmd notes.md
```

使用工具写 UTF-8 源文件；避免把多行 Mermaid 拼入 shell 参数。PowerShell 重定向前确认编码，尤其是 Windows PowerShell 5.1。

这里的 CLI 是本技能提供的辅助脚本，**不是 Pele 官方 CLI**。默认禁用链接和图片，渲染在可终止 worker 中进行，默认 10 秒；保留已有输出，只有明确需要覆盖时使用 `--force`。详见 [本地命令](references/local-cli.md)。

## 始终保留的语义边界

- Pele 输出 SVG，使用自身布局；Mermaid 主题、插件、ELK 外观或逐像素复刻不是兼容承诺。
- `render()` 抛出错误；`mount()` / `update()` 的绘图错误通过 `.error`、`onError` 和容器提示呈现。两种路径的验收方式不同。
- 同一页多图使用不同 `idPrefix`；同一源文件重复嵌入时也需不同前缀。`mount()` 默认自动分配。
- 颜色用 `--pele-*`。颜色切换无需重算布局；字体变化会影响测量，需要刷新或重渲染。
- 不可信输入保留长度与边数限制，错误用 `textContent` 显示，图标与数学 resolver 只返回可信标记。具体策略见 [安全边界](references/security-and-compatibility.md)。
- 生产项目沿用现有依赖管理与授权范围；不要为了生成一张图替换项目渲染器、安装第三方 MCP 或修改宿主配置。
