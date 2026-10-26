# Run Pele

**Render Mermaid diagrams to SVG and HTML with Pele.** Run Pele combines a reusable coding skill, a local command-line wrapper, Markdown validation, and a searchable example catalog. Rendering runs locally in Node.js without a browser.

[中文主页](README.md) · [Skill instructions](SKILL.md) · [CLI reference](references/local-cli.md) · [Official Pele documentation](https://pele.run/)

![Document review flowchart rendered by Pele: drafts are reviewed, revised when needed, and published after approval.](assets/readme/review-flow.svg)

This image is an actual Pele-generated SVG, committed with its [editable Mermaid source](examples/review-flow.mmd). GitHub displays the image directly; it does not run Pele in the README.

## Quick start

Requires **Node.js 20+** and npm. The renderer is pinned to **Pele 1.10.0** in the lockfile.

```sh
git clone https://github.com/KRPCT/run-pele.git
cd run-pele
npm ci --ignore-scripts --no-audit --no-fund

node scripts/render.mjs examples/review-flow.mmd review.svg
node scripts/render.mjs examples/order-handoff.mmd order.html --lang zh-CN
node scripts/render.mjs --check examples/review-flow.mmd
```

Open `review.svg` or `order.html` locally. Output files are preserved by default; add `--force` when replacing an existing result is intended. The scripts do not upload diagram text or start a server.

For Markdown files containing Mermaid code fences:

```sh
node scripts/render.mjs --check notes.md
```

## Use as a skill

Install with the [Skills CLI](https://github.com/vercel-labs/skills), which requires **Node.js 22.20+**. The local Pele renderer itself requires Node.js 20+.

```sh
npx skills add KRPCT/run-pele --skill run-pele
```

Preview discovery with `npx skills add KRPCT/run-pele --list`, or open the [skills.sh detail page](https://skills.sh/krpct/run-pele/run-pele). [Installation verification](validation/skills-cli.json) covers the public-repository install and the installed runtime.

Choose the client and installation scope in the installer. The renderer dependency is restored with `npm ci --ignore-scripts --no-audit --no-fund` from the installed skill directory when needed.

Then ask a compatible coding assistant:

> Use $run-pele to draw an order handoff as a swimlane diagram. Save editable Mermaid source and an HTML preview, and validate the result.

The skill includes guidance for browser integration with `mount()`, theme variables, lazy loading, error recovery, and migration from Mermaid.js. It is an independent integration, not an official Obsidian skill.

## Example: order handoff

This swimlane diagram uses Chinese labels to show work moving between a customer, a warehouse, and finance.

![Chinese order-fulfillment swimlane rendered by Pele: customer submits an order, warehouse picks and ships it, and finance issues an invoice.](assets/readme/order-handoff.svg)

[Mermaid source](examples/order-handoff.mmd) · [Generated SVG](assets/readme/order-handoff.svg)

```sh
node scripts/render.mjs examples/order-handoff.mmd phone.html --max-width 320 --lang zh-CN
```

`--max-width` requests an adapted layout; it is not a strict upper bound on the SVG's natural dimensions. See [layout and export guidance](references/theming-and-layout.md).

The Chinese homepage contains 12 detailed scenarios across 12 diagram types, a project-native SVG header, and a three-theme comparison. All showcase assets are reproducible with `npm run showcase`. Their renderer version and dimensions are recorded in the [showcase manifest](assets/readme/manifest.json).

## Find a diagram pattern

The catalog contains **591 distinct examples from 32 official example pages**. The installed renderer exposes **33 normalized diagram types**, including the diagnostic `info` type. See the [source inventory](references/sources.md).

```sh
node scripts/catalog.mjs
node scripts/catalog.mjs --type sequence --search critical
node scripts/catalog.mjs --type swimlane --example 1
```

Choose a diagram by what it explains: flowcharts for decisions, sequence diagrams for messages, ER diagrams for data relationships, swimlanes for responsibility, and Sankey diagrams for quantities moving between categories. The [syntax guide](references/syntax.md) covers all supported types and exact headers.

## Behavior and limits

| Need | Behavior |
| --- | --- |
| SVG or standalone HTML | Generated locally with Pele; editable `.mmd` files remain the source |
| Markdown validation | Renders top-level Mermaid fences and reports errors with source positions |
| Untrusted diagram text | The wrapper disables links and images by default and uses a terminable render worker |
| Light and dark themes | CSS variables; built-in `light`, `dark`, and `auto` themes |
| Browser application | Use Pele's `mount()` API for resizing, updates, and zoom |
| PNG, PDF, or Mermaid plugins | Require a separate export path or another renderer; not built into this wrapper |

Pele targets [Mermaid 12.1.0 syntax](https://pele.run/compatibility) and uses its own layout. It does not promise pixel-identical Mermaid.js output. See the [security and compatibility guide](references/security-and-compatibility.md) before integrating untrusted content.

## Verification

```sh
npm run verify
```

The checks render all 591 captured examples and 12 detailed showcase scenarios at natural width and at 320px, cover all 33 installed types, and exercise invalid input, core/lazy imports, Markdown errors, output protection, and worker timeouts. The [validation summary](validation/summary.json) states the scope; this is not a visual audit of every diagram or the upstream full test suite.

## FAQ

### Does Run Pele need Chrome or Puppeteer?

No. SVG generation uses the Pele library in Node.js. A browser is useful for inspecting the final HTML and real font layout.

### Is this an official Pele CLI or MCP server?

No. These scripts are a local wrapper around [obsidianmd/pele](https://github.com/obsidianmd/pele). The repository does not provide an MCP server. Related community tools are listed in the [ecosystem reference](references/ecosystem.md).

### Can the SVG follow an application's theme?

Yes. Inline SVG can inherit `--pele-*` CSS variables. The wrapper embeds theme CSS in standalone output. An SVG loaded through an `<img>` cannot inherit the surrounding page's CSS variables.

## References and license

[API integration](references/api-and-integration.md) · [Themes and export](references/theming-and-layout.md) · [Syntax](references/syntax.md) · [Sources](references/sources.md)

[MIT](LICENSE). Pele and its included upstream material retain their [third-party notices](references/third-party-notices.md). Maintained by [KRPCT](https://github.com/KRPCT).
