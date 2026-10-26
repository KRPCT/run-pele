# 来源与验证范围

核验基线：2026-10-26，`pele@1.10.0`，官方源码提交 `4eff76f98c73b6817800a05773517f35832e4e92`。所有链接均指向项目的一手资料；安装和升级以实际选定版本为准。

## 官方来源

| 内容 | 来源 |
| --- | --- |
| 项目与用途 | [Pele 官网](https://pele.run/) |
| 图型与示例 | [Examples](https://pele.run/examples)，以及 32 个图型子页 |
| API、入口和生命周期 | [API](https://pele.run/api) 与发布包 TypeScript 声明 |
| CSS 变量与字体 | [Theming](https://pele.run/theming) |
| 语法与布局差异 | [Compatibility](https://pele.run/compatibility) |
| 不可信内容与限制 | [Security](https://pele.run/security) |
| 固定版本源代码 | [obsidianmd/pele](https://github.com/obsidianmd/pele/tree/4eff76f98c73b6817800a05773517f35832e4e92) |
| 发布包 | [pele 1.10.0 npm 元数据](https://registry.npmjs.org/pele/1.10.0) |

页面也提供 Markdown 版本，例如 `/api.md`、`/examples/flowchart.md`；首页对应 `/index.md`。

## 示例语料

[assets/examples.json](../assets/examples.json) 包含 32 个官方示例页中的 601 个 Mermaid 代码块，按完整源码去重后为 591 个。每个条目保存源文本、稳定 ID，以及全部出现位置的 URL、代码块序号和章节。查询时使用 `scripts/catalog.mjs`，无需一次读入全部示例。

示例查询名使用 `git`、`quadrant`、`treeview`，Pele 模块名分别为 `gitGraph`、`quadrantChart`、`treeView`。`info` 是发布包的第 33 个规范化图型，没有独立示例页；catalog 为它提供一个诊断示例。

[syntax.md](syntax.md) 是图型选择与常见构造的操作索引，不是每个 parser 的完整形式文法。完整结构应参考对应源码示例。上游许可见 [third-party-notices.md](third-party-notices.md)。

## 验证证据

[validation/summary.json](../validation/summary.json) 记录发布内容的运行环境、版本、输入指纹与实际检查范围。运行 `npm run verify` 可以重新验证：

- 591 个示例各渲染常规宽度与 320px 宽度，共 1,182 次语料渲染。
- 33 个已安装图型都有代表样例。
- 解析错误、未知图型、源码/输出限额、链接策略、core 注册与 lazy 加载。
- 本地 SVG/HTML 输出、Markdown 错误位置、已有文件保护、worker 超时终止。

[README 图像清单](../assets/readme/manifest.json) 记录实际用于展示的 Pele 版本、源文件和产物。运行 `npm run showcase` 可重新生成。

这些检查不等同于完整上游测试、差分 fuzz、安全认证、性能基准或所有图的目视检查。浏览器字体测量与 Node 字宽估计不同；目标浏览器和最终导出格式仍需按使用场景验证。

## 站点覆盖与本地重建

抓取器从导航、站内链接、sitemap 和已知源码路由发现公开内容，合并 query/hash 变化。基线覆盖 115 个成功资源：75 个 HTML 页面、38 个 Markdown 文档及 robots/sitemap 两个索引；`llms.txt` 返回 404。

范围包括首页、API、主题、兼容性、安全、全部示例、Playground、比较页、演示页与错误页。`/404` 内容为 Not found，即使直接请求返回 HTTP 200。Sitemap 包含 39 个正式导航路由。

```sh
python scripts/capture_site.py --output archives/new-capture
python scripts/extract_examples.py archives/new-capture/site.zip archives/new-examples.json
```

脚本为每份响应记录 URL、状态、大小、SHA-256，并生成 ZIP。`archives/` 是被 Git 忽略的本地生成目录。HTML 中的内联 SVG 会保留；JS/CSS/字体/媒体仅建索引，不构成完整离线网站镜像，也不遍历外站、登录内容或无限分享链接。

完整官方源码可从 [固定提交 ZIP](https://github.com/obsidianmd/pele/archive/4eff76f98c73b6817800a05773517f35832e4e92.zip) 获取。阅读源码无需执行仓库安装脚本。

## Playground 与更新

Playground 的分享链接把源码编码进 URL hash；它不是服务器项目保存接口。`/api` 是 API 文档，不是 HTTP 渲染服务；`/compare` 用于视觉比较，`/video` 为演示页面。

升级时先核对 npm 元数据与官方变更，选择精确版本；在新目录重新抓取和抽取语料，对比图型与行为，再更新依赖、锁文件和受影响说明。需要重新验证公开数字时运行对应检查，不把先前结果当成新版本的证据。
