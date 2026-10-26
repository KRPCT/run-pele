# 安全、兼容与诊断

依据 [Security](https://pele.run/security)、[Compatibility](https://pele.run/compatibility)，核验 `pele@1.10.0`。遵循任务自身信任边界，不把局部示例当作完整安全认证。

## 不可信源码

库会转义文本、过滤链接和样式，并限制输入/输出大小。源码不会变成脚本、事件处理器或任意 HTML 标签；JavaScript click callback 被忽略。

| 边界 | 处理 |
| --- | --- |
| 错误消息包含源文本 | 显示用 `textContent`，日志也按敏感文本处理 |
| 图中图片 | 展示时可能联网；不需要时 `images: false` |
| 图中链接 | 不需要时 `links: false`；宿主单独控制导航 |
| `icons` / `math` 返回值 | Pele 原样插入；仅返回可信 resolver 的标记 |
| internal link | `href` 是笔记名，没有经过 URL 过滤；按笔记名处理，不直接传给通用 URL 打开器 |
| `options` / `options.config` | 由宿主构造；不直接接收图作者提交的对象 |
| CPU 耗时 | 源码大小限制不等于时间限制；放在可终止 worker/进程中 |

库默认链接 scheme 为 `http`、`https`、`mailto`、`tel`，图片为 `http`、`https`；允许相对 URL。默认阻止 `//host/...` 网络路径。`linkSchemes` / `imageSchemes` 替换默认允许列表；`javascript:`、`data:`、`vbscript:` 始终禁止。`linkRel` 默认 `noopener`，替换时保留应用需要的安全属性。

默认限额：50,000 字符源码、4,000,000 字符 SVG、flowchart/agentflow 5,000 边。超限应解释并拆分或减少内容；只有已理解输入规模与资源影响时才调整，不将放宽限额当作自动修复。

`mount({sanitize})` 在每次插入前接受 `(svg: string) => Node`。若应用已有 SVG sanitizer，接入现有策略。HTML/MathML 数学经 `<foreignObject>` 嵌入，常被 sanitizer 移除；需要该路径时改用 SVG math 输出。

## 兼容承诺的边界

| 方面 | Pele 行为 |
| --- | --- |
| 语法 | 目标为 Mermaid 12.1.0 内置图型，33 个规范化类型；不是对未来版本的保证 |
| 布局 | 自身引擎；位置、间距、连线不同；源码 `flowchart-elk` 可被识别，但不是加载 ELK |
| 主题 | CSS variables；Mermaid theme/themeVariables 配色不适用 |
| 外部插件 | ZenUML 等不支持；需原引擎时尊重用户选择 |
| 标签 | SVG 文本、有限换行/粗体/斜体等；不支持任意 HTML 标签 |
| 子图 | flowchart 子图可在连接外部节点时仍保留自身 direction |
| 回调 | URL click 可用，JavaScript callback 忽略 |
| 图标 | 自定义图标需要宿主 resolver；不能把成功渲染等同于图标已出现 |
| 数学 | 无内置 typesetter；未提供 resolver 时显示 TeX |
| Sankey | 额外支持 Unicode CSV 节点名；值 `50%` 读为 50；以非数字开头的值会报 syntax |
| Sankey 渐变 | 需要 idPrefix 避免跨图 ID 冲突；无前缀使用来源节点颜色；mount 自动有前缀 |

`-beta` 是 Mermaid 的图型关键字的一部分，不是包版本，也不能据此判断某次 Pele 实现的质量。完整图型关键字和模块名见 [syntax.md](syntax.md)。

## 有界诊断

1. 保存最小失败源文本、Pele 版本、入口与选项，确认报错来自哪个路径。
2. 根据错误类型修复对应层，不以切换图型掩盖原需求。
3. 重跑同一失败样例与受影响输出；通过即交付。相同目标连续失败时先诊断，不无界改写。

| 症状 | 下一步 |
| --- | --- |
| `unsupported-diagram` | 检查精确首行、`-beta`、入口的 register/load；再判断是否外部插件 |
| `syntax` | 用 `.line` / `.column` / `.snippet` 定位；与同图型真实示例比较引号、箭头、围栏和缩进 |
| `semantic` | 核对日期、未定义分支等业务对象；语法正确不代表对象关系有效 |
| `limit` | 找到输入/输出/边数/嵌套深度约束；合理拆图 |
| 有旧图但更新失败 | 检查 `Mounted.error`，旧 result 不是当前 source 的成功证据 |
| 窄屏方向变化 | 检查 maxWidth、autoDirection 和 breakpoint；按所需阅读顺序决定 |
| 节点标签溢出 | 检查字体是否加载、测量字体与 CSS 是否一致，refresh/重渲染 |
| 主题似乎无效 | 找源中的固定色、img 文档隔离和 selector 范围 |
| 导出黑块/丢数学 | 检查目标工具对 CSS variables、foreignObject 和字体的支持 |
| 多图箭头/渐变异常 | 检查 idPrefix 与 DOM ID 冲突 |

`PeleError` 的无位置错误使用 line/column=0，不能把它当成源码第 0 行。消息含源文本，不适合未经筛选写入公开 issue。

## 适用范围

适合文档图、浏览器笔记/聊天中的图、构建期 SVG、需要主题切换或窄屏适配的 Mermaid 渲染。需要 Mermaid 原样布局、外部插件、任意 HTML 标签、点击执行 JavaScript、编辑器式拖拽建模，或直接导出位图时，需要额外组件或其他工具；先说明差异，再按用户目标选择。

官网速度与包体积数字是项目提供的比较值，不能转述成本项目在所有数据规模上的性能保证。本技能没有复现官方基准或完整 parser fuzz 测试。
