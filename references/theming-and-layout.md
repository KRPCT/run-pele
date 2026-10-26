# 主题、布局与导出

依据 [Theming](https://pele.run/theming)、[API](https://pele.run/api) 与官网窄屏示例。Pele 的视觉模型是 SVG + CSS custom properties，保持图表内容与主题分离。

## 主题变量

| 变量 | 作用 |
| --- | --- |
| `--pele-bg`, `--pele-fg`, `--pele-muted` | 背景、文字、次要文字 |
| `--pele-line`, `--pele-border` | 连线/箭头、节点/分组边框 |
| `--pele-surface`, `--pele-surface-alt` | 节点与分组填充 |
| `--pele-accent`, `--pele-critical`, `--pele-error` | 强调、关键/高优先级、挂载错误 |
| `--pele-series-1` 至 `--pele-series-8` | 图表与类别色，超过 8 类循环使用 |
| `--pele-font`, `--pele-font-mono` | 普通和等宽字体 |
| `--pele-title-weight`, `--pele-heading-weight`, `--pele-bold-weight` | 标题、图内标题、标签加粗权重 |
| `--pele-radius` | 圆角，默认 4px |
| `--pele-zoom-top/right/bottom/left`, `--pele-zoom-cursor` | 缩放按钮定位与指针 |

设置在根 `<svg class="pele">` 或祖先元素。色彩变化可立即生效，无需再次 parse/render。少数图形文字使用 `--pele-bg`，系列色要与它保持对比。主题切换后观察实际文字、节点、连线和选中状态，而不仅是背景颜色。

```css
.diagram {
  --pele-bg: #ffffff;
  --pele-fg: #20242b;
  --pele-line: #465365;
  --pele-surface: #f1f4f8;
  --pele-surface-alt: #e4eaf2;
  --pele-border: #8492a5;
  --pele-accent: #285ec9;
  --pele-font: "Noto Sans CJK SC", sans-serif;
}
```

源码 `style`、`classDef`、`linkStyle` 的固定颜色可以覆盖主题；Mermaid 的 `theme` / `themeVariables` 不控制 Pele 配色。希望跟随主题时，把颜色留在宿主 CSS，只在确实表示固定业务含义时使用固定色。

## 定向 CSS

常用类：`pele`、`pele-flowchart`、`pele-title`、`pele-node`、`pele-edge`、`pele-edge-label`、`pele-cluster`、`pele-cluster-label`、`pele-label`、`pele-marker`、`pele-icon`、`pele-math`。

```css
.pele-node[data-id="review"] .pele-label {
  fill: var(--pele-accent);
}
```

选择器应限制在当前图的容器中，避免修改页面上所有图。新版本升级后核对所依赖的结构与类名。

## 字体与尺寸

测量字体和显示字体必须相同。`mount()` 读取 CSS 的 `--pele-font` / `--pele-font-mono`，缺省使用容器普通字体与 monospace。字体切换后 `refresh()`；`render()` 要重新传 `fontFamily` 等选项执行。

`responsive: true` 只让 SVG 缩小；`maxWidth` 才会参与布局。`mount()` 自动提供容器宽度；单次 `render()` 需要调用方提供。默认小于 640px 可自动换向，若方向携带业务含义，使用 `autoDirection: false`，并准备横向滚动或合理分图。

窄屏并不总是同一种变化：flowchart/swimlane 可改纵向；Ishikawa 可能变为原因树；railroad 长序列换行；eventmodeling 帧纵向排列；tree view 描述移到条目下方；architecture 保留指定连接侧。对用户重要的方向、分组和阅读顺序需要逐图检查。

## 可复用设计模式

- 分层表达：一张总览图说明系统边界，细节图说明某条流程；保持 ID、术语和颜色语义一致。
- 保持源文本：输出 SVG 旁保留 `.mmd`，方便后续修订与版本比较。
- 先内容后样式：节点/边和单位正确后调整宽度、字体、标签长度。不要用换色掩盖错误关系。
- 对比迁移：用同一份源码对比 Pele 与 Mermaid，分别核对语义和视觉，不以 SVG 字节差异衡量兼容。

## SVG、HTML、PNG、PDF

Pele 原生输出 SVG。网页内联 SVG 能继承宿主 CSS；`<img src="diagram.svg">` 内的 SVG 属于独立文档，不能继承页面里的 `--pele-*`。需要独立文件携带主题时，将主题样式或具体值写入 SVG 自身。

不少非浏览器转换器对 CSS variables 支持有限，直接转换可能出现黑块、缺色或字体错位。先在受控浏览器中解析 computed styles，或使用经过验证的静态颜色转换，再交给目标转换器。必须保留 `url(#...)` 的 gradient/marker 引用，不能用简单全局替换破坏这些 ID。

数学若使用 `<foreignObject>`、远程图片、未安装字体或外部 CSS，必须在目标导出环境单独验收。用于论文/文档/幻灯片时检查最终 PNG/PDF，不只检查原 SVG。

本技能自带 CLI 的 HTML 是可离线打开的静态 SVG 预览；页面边距不参与图内布局。需要交互缩放或编辑时，采用 `mount()` / `enableZoom()`，按应用任务实现。
