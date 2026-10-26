# API 与集成

基线：[官方 API](https://pele.run/api)，`pele@1.10.0`。参数详情的完整原文在抓取快照 `api.md`；本文只保留实现决策、重要契约及组合方式。

## 运行方式

| 目标 | 入口与行为 |
| --- | --- |
| Node/构建期生成 SVG | `import { render } from 'pele'`，同步，无需 DOM |
| 浏览器交互与容器自适应 | `mount(container, source, options)`，自动监听宽度 |
| 只需少数图型 | 从 `pele/core` 导入 API，从 `pele/diagrams/<type>` 导入并 `register()` |
| 按图型延迟加载 | `pele/lazy` 的 `renderAsync`、`mountAsync`、`load` |
| 无打包器浏览器 | `dist/pele.global.js` 的全局 `pele`，或 `dist/pele.js` ESM |

保持同一工作路径的 API 来自同一入口。不要把从 `pele` 导入的 `supports()` 与 `pele/core` 的局部注册状态混为一谈。模块 ID 使用 `gitGraph`、`quadrantChart`、`treeView`，而示例页 URL 用 `git`、`quadrant`、`treeview`。

```js
import { register, render } from 'pele/core';
import flowchart from 'pele/diagrams/flowchart';
import sequence from 'pele/diagrams/sequence';

register(flowchart, sequence);
const result = render(source, { idPrefix: 'request-flow' });
```

```js
import { renderAsync, load } from 'pele/lazy';
await load('sequence');
const result = await renderAsync(source);
```

`supports()` 在 core/lazy 中只确认已经注册/加载的图型。识别到图型但未注册也会得到 `unsupported-diagram`。静态网站通常构建期渲染即可；实时编辑器需要浏览器或服务端渲染路径。

## 同步渲染契约

```ts
render(source: string | DiagramModel, options?: RenderOptions): RenderResult
parse(source: string, options?: { limit?: number; maxEdges?: number; config?: object }): ParsedDiagramModel
detectType(source: string): DiagramType | null
supports(source: string): boolean
```

`RenderResult` 包含 `svg`、自然尺寸 `width` / `height`、`type`、`mermaidType`、`links`。每条链接含 `id`、`href`、`internal`。`svg` 是单个 `<svg>`，不是完整网页或位图。

`parse()` 后可以多次渲染模型。解析阶段的 `limit`、`maxEdges`、`config` 要在创建模型时传入，不能指望之后 `render(model)` 重新解析原始文本。

```js
const model = parse(source, { limit: 50_000, maxEdges: 5_000 });
const desktop = render(model, { idPrefix: 'desktop' });
const phone = render(model, { idPrefix: 'phone', maxWidth: 320 });
```

## RenderOptions 的决策索引

| 选项 | 用途与默认值 |
| --- | --- |
| `fontFamily`, `fontFamilyMono`, `fontSize` | `sans-serif`、`monospace`、16 px；与显示字体一致 |
| `measurer` | 自定义 `width(text, size, style)`；浏览器默认 canvas，Node 默认字宽表 |
| `idPrefix` | 同页唯一、仅安全字符；关系到箭头、渐变和可访问性引用 |
| `responsive` | 默认 true；只允许 SVG 缩放，不等于重新布局 |
| `maxWidth` | 提供可用宽度以启用布局适配，不是强制裁剪 |
| `autoDirection`, `directionBreakpoint` | 默认 true、640 px；可允许宽图改为纵向 |
| `padding` | 图外围空白 |
| `now` | `number` 或 `Date`；Gantt 今天标记与省略开始日期的任务参考时间，默认当前时间 |
| `limit`, `outputLimit`, `maxEdges` | 默认 50,000 字符、4,000,000 字符、5,000 边（后者针对 flowchart/agentflow） |
| `links`, `images` | 库默认 true；由应用根据信任边界显式设置 |
| `linkSchemes`, `imageSchemes`, `linkRel` | URL 策略；替换默认值而非自动追加，详见安全参考 |
| `icons` | 可信图标名到 SVG 标记的 resolver，未知名返回 null/undefined |
| `math` | `(tex, size) => {svg,width,height} 或 {html,width,height}`，无默认排版器 |
| `config` | Mermaid 配置默认值；源码 frontmatter/init 可覆盖，支持随图型变化 |

## 浏览器生命周期

```js
import { mount } from 'pele';

const diagram = mount(container, source, {
  links: false,
  images: false,
  onRender(result) {
    // 如有用户需要的交互，在这里重新绑定到本次生成的 SVG。
    status.textContent = `${result.type} · ${Math.round(result.width)} px`;
  },
  onError(error) {
    status.textContent = error instanceof Error ? error.message : String(error);
  },
});

diagram.update(nextSource);
// 字体或容器位置改变后：
diagram.refresh();
// 组件卸载时：
diagram.destroy();
```

容器应是宽度独立于图自身的块级元素。`mount()` 读取 CSS 字体、测量容器、处理 ResizeObserver 与尚未加载的 web fonts。`destroy()` 停止观察，保留最后 SVG；宿主组件负责自己的 DOM 清理。

`Mounted` 的 `source` 总是最近给入的文本；`result` 可能仍是最后一次成功结果；失败后旧图会变暗并显示错误。验收当前源文本必须检查 `.error` 或回调，不能只看容器是否仍有 `<svg>`。`update(text, options?)` 的 options 是替换，不是增量 merge。保留选项时自行合并已有可信 options。

`mountAsync()` 先加载所需图型再挂载；以后更新到另一图型，先 `await load(type)`。快速切换输入的宿主要处理加载期间的旧请求竞争，避免较旧源码覆盖最新编辑。

## 缩放

`mount()` 默认 `zoom: 'auto'`，图缩小以适应容器时启用；true 始终启用，false 禁用。配置对象支持 `always`、`maxScale`（默认 3）、`controls`（默认 true）、`labels`（按钮本地化）。

已有 SVG 使用 `enableZoom(container, options)`。返回对象有 `scale`、`fit`、`zoomBy`、`zoomTo`、`reset`、`refresh`、`destroy`。换了 SVG 后 `refresh()`；卸载时 `destroy()`。默认输入包括 pinch、Ctrl/⌘+wheel、拖动、双击，以及聚焦时 `+ - 0` / 方向键；普通滚轮仍滚动页面。

## 字体、图标与数学

TextMeasurer 的 `style` 是位标志：bold=1、italic=2、monospace=4。自定义测量函数要覆盖这些组合。Node 默认估计不等于任意自定义字体的真实字宽；中文长标签尤需在实际显示环境检查。

外部图标包不会因出现 `fa:fa-car` 自动下载。用静态可信映射实现 resolver；architecture 与 tree view 有部分内置符号，不代表支持所有品牌图标。

数学适用于 flowchart、swimlane、sequence、state、class、ER、mindmap、kanban、block、requirement、usecase 的相关标签；class 成员和图标题仍是文本。无 resolver 时保留 TeX。resolver 每次 render 都会调用，缓存键至少含 TeX、字号及影响输出的排版配置。

- 导出与 sanitizer 路径优先返回 SVG。MathJax 加载 `ui/safe`，`svg.fontCache: 'none'` 避免 sanitizer 移除字体引用；等待 startup 完成。
- KaTeX 保持 `trust: false`。若返回 MathML，先在页面测量，再返回 `{html,width,height}`；该结果包在 `<foreignObject>` 中，仅适合浏览器，常被 sanitizer 去掉。
- resolver 标记不会由 Pele 再过滤。使用可信排版器并限制其输出；不要直接回传源文本。

## 确定性与缓存

缓存键包含源码、Pele 版本、选项、目标宽度、字体/测量方式、图标及数学策略；Gantt 固定 `now`。缓存 SVG 嵌入多处时应确保 `idPrefix` 不冲突。构建期静态 SVG 不会自动获得浏览器的动态重新布局。

CDN 若确有需求可使用 `https://cdn.jsdelivr.net/npm/pele@1.10.0/dist/pele.global.js`；离线任务使用项目依赖或本地 vendored bundle。联网加载是交付选择，不是生成 SVG 的前提。
