# S9 - Headless UI Design System

A comprehensive product UI system for **Socket9** — a clean, blue-accented, Inter-based interface library for dashboards, data-dense applications, and marketing surfaces. This project is the machine-readable source: design tokens, reusable React components, foundation specimen cards, and a full dashboard UI kit.

> **Source of truth:** the attached Figma file **"S9 - Design System .fig"** (mounted virtual file). Pages cover Foundations, Layout, Icons, and \~45 component pages. All tokens, component specs, and the icon inventory in this project were extracted directly from that file.

---

## Content fundamentals

- **Voice & tone:** plain, professional, confident. Product UI copy is terse and action-oriented ("New invoice", "View all", "Export"). No marketing fluff inside the app shell.
- **Person:** address the user directly and warmly in app chrome ("Welcome back, Jordan"); otherwise neutral/system voice for labels.
- **Casing:** **Sentence case** for everything — buttons, titles, menu items, table actions ("New invoice", not "New Invoice"). The only uppercase is small **section eyebrows / table headers** (`MAIN`, `INSIGHTS`, `CUSTOMER`), tracked out at \~0.06em.
- **Numbers:** compact and tabular — `$248.6k`, `3,842`, `4.7%`, `12.4%`. Currency uses `$` prefix; deltas pair with a trend arrow and up/down color.
- **Emoji:** none. The brand uses Material icons, never emoji.
- **Vibe:** calm, trustworthy fintech/SaaS. Lots of whitespace, hairline dividers, one confident blue accent, restrained color.

---

## Visual foundations

- **Color:** A single brand **blue** (`--blue-500` = `rgb(0,82,255)`) carries primary actions, active nav, links, and the first chart series. Neutrals are a slightly cool grey ramp (`--neutral-50…950`). Semantic families: green (success), amber (warning), red (danger), cyan (info). Backgrounds layer as `--bg-canvas` (white) › `--bg-sunken` (neutral-50) for app background › `--bg-surface` (white) for cards. Full **dark theme** ships via `:root[data-theme="dark"]` / `.dark`.
- **Type:** **Inter** for everything (headings + body + UI). Noto Sans Thai is the Thai-script fallback. Display sizes run light/regular weight with negative tracking; titles 600; body 400; strong 700; eyebrows/headers 600 uppercase. See `tokens/fig-tokens.css` for the full type scale.
- **Spacing:** 4-based scale — `xxs 4, xs 8, sm 12, base 16, md 20, lg 24, xl 32, xxl 48, section 96`.
- **Radii:** `xs 4, sm 8, md 12, lg 16, xl 24, pill/full 999`. Buttons & inputs use **12** (md); cards use **16** (lg); badges/avatars are pill/circle.
- **Borders & dividers:** 1px hairlines using `--border-subtle` (neutral-100) and `--border-default` (neutral-200). Inputs use an **inset box-shadow** ring (1px default, 2px blue on focus) rather than a border so layout never shifts.
- **Elevation:** restrained. Cards are usually **outlined** (1px inset hairline) on the sunken background; **elevated** cards add a soft, low, two-layer shadow (`0 1px 2px / 0 8px 24px` at 4–6% black). Popovers/menus float on `0 10px 30px` at 12%.
- **Backgrounds:** flat color only — **no gradients** in chrome. The one gradient use is the subtle area-chart fill (brand color fading to transparent).
- **Hover / press:** hover lightens (ghost → `--secondary-soft-hover`) or darkens one solid step (`--primary-solid-hover`); active darkens another step **and** scales down (`scale(0.98)` buttons, `0.96` icon buttons). Nav/table rows hover to `--secondary-soft`.
- **Active selection:** the brand's signature — a **soft blue fill (`--primary-soft`) with blue text and a blue leading dot/icon** marks the current nav item / selected option.
- **Motion:** quick and functional — 100–160ms ease transitions on background, transform, box-shadow. No bounces, no decorative loops.
- **Imagery:** product is data-first; avatars are the main imagery (circle by default, rounded-square option, status dot). Charts are clean SVG using the `--series-*` palette.

---

## Iconography

- The S9 icon library **is the complete Google Material Icons set** (\~1332 glyphs, the "Round" variant), organized in the source by Material's standard categories (Action, Alert, Communication, Content, Editor, Image, Navigation, Notification, Social, Toggle, …).
- Delivered as the **Material Symbols Rounded** variable font from Google Fonts CDN (see `tokens/fonts.css`) so every glyph resolves by name via ligature — no per-icon SVGs to manage.
- Use the **`Icon`** component: `<Icon name="check_circle" />`. `fill`, `weight` (100–700), `size`, and `color` are supported. Active states use `fill`.
- No emoji, no unicode-glyph icons. **Substitution note:** the font is loaded from Google's CDN rather than bundled binaries; swap in licensed/static copies for offline/production use.

---

## Index / manifest

**Root**

- `styles.css` — global entry (import this one file). `@import`s fonts + tokens + typography.
- `readme.md` — this guide.
- `SKILL.md` — Agent Skill manifest.

**Tokens** (`tokens/`)

- `fig-tokens.css` — all 321 Figma Variables (colors, spacing, radius, type scale) incl. dark theme.
- `fonts.css` — Inter, Noto Sans Thai, Material Symbols Rounded (CDN).
- `typography.css` — semantic `.text-*` classes + font-family aliases.

**Components** (`components/`) — React primitives, each `Name.jsx` + `Name.d.ts` + a `@dsCard` HTML:

- `icon/` — Icon (Material Symbols wrapper)
- `buttons/` — Button, IconButton
- `forms/` — Input, Textarea, Select, Checkbox, Radio, RadioGroup, Switch
- `data-display/` — Card, CardHeader, StatCard, Badge, BadgeCount, Avatar, AvatarGroup, Table
- `navigation/` — Tabs, Sidebar, NavItem, NavSection, Topbar, SearchField, Breadcrumbs, Pagination, Accordion, ProgressTracker
- `charts/` — AreaChart, BarChart, Sparkline
- `feedback/` — Spinner, Banner, InlineMessage, Toast, ToastProvider, Tooltip
- `overlays/` — Modal, Drawer, Popover, DropdownMenu
- `display/` — Divider, Skeleton (SkeletonLine/Circle/Block/Text), EmptyState, Slider, Toolbar
- `marketing/` — Hero, Footer

**Foundations** (`guidelines/`) — specimen cards: color (primary, neutrals, semantic), type (display, body), spacing, radius.

**UI kits** (`ui_kits/`)

- `dashboard/` — full analytics dashboard composed from the components.

---

## Caveats

- **Fonts** (Inter + Material Symbols) load from Google Fonts CDN; no local binaries were in the source file. Provide font files for offline/production bundling.
- **Components** are clean, prop-driven recreations authored from the Figma specs — not 1:1 dumps of the Figma frames. They cover the core families needed to build real screens; the source file also contains many lower-level/variant-only families (e.g. individual Day Cell / Slider Track / Skeleton primitives) folded into their parent components here.
