# Div Brick Component

A versatile layout component system for structuring markdown content with reusable container patterns — sections, grids, cards, flex rows, and bands.

## Component Layout Structure

```
bricks/div/
├── atoms.njk           # Basic div wrappers: renderDivOpen, renderDivClose, renderDivBox
├── atoms.uno.json      # Atom element styling shortcuts
├── molecules.njk       # Composed containers: section, grid, card, flexRow, band
├── molecules.uno.json  # Composed layout styling shortcuts
└── readme.md           # Documentation and component demo blocks
```

## Available Macros

| Macro | Description |
|-------|-------------|
| `renderDivOpen(customClass, id)` | Open a generic `<div>` with optional class/id |
| `renderDivClose()` | Close a `<div>` |
| `renderDivBox(content, customClass, id)` | Simple boxed div with markdown content |
| `renderSection(content, customClass, id, bgClass)` | Full-width section with inner container |
| `renderGrid(items, cols, gap, customClass)` | Responsive CSS grid (1-6 columns) |
| `renderCard(content, title, image, url, customClass)` | Card with optional image, title, link |
| `renderFlexRow(items, align, justify, wrap, gap, customClass)` | Flexbox row layout |
| `renderBand(content, title, subtitle, bgClass, customClass)` | Full-width banner with title/subtitle |

## Markdown Usage Examples

### Using `:::Div` (component via YAML props)

```markdown
:::Div
type: "section"
content: |
  ## Tiêu đề section

  Nội dung markdown ở đây...
:::
```

### Using `{% Div %}` (component via inline props)

```markdown
{% Div
  type="card",
  title="Thẻ bài viết",
  image="/images/photo.jpg",
  content="**Nội dung** nổi bật trong thẻ.",
  url="/bai-viet/"
%}
```

### Section with background

```markdown
:::Div
type: "section"
bgClass: "bg-glow-radial"
content: |
  ## Giới thiệu về chúng tôi

  Đây là một section có background glow nhẹ.
:::
```

### Grid layout (2 columns)

```markdown
:::Div
type: "grid"
cols: 2
items:
  - title: "Cột 1"
    content: "Nội dung cột bên trái."
    image: "/images/col1.jpg"
  - title: "Cột 2"
    content: "Nội dung cột bên phải."
    image: "/images/col2.jpg"
:::
```

### Card

```markdown
:::Div
type: "card"
title: "Dự án nổi bật"
image: "/images/project.jpg"
content: "Mô tả ngắn về dự án..."
url: "/du-an/"
:::
```

### Flex row

```markdown
:::Div
type: "flexRow"
align: "items-start"
justify: "justify-center"
gap: "gap-8"
items:
  - "### Cột A\nNội dung A"
  - "### Cột B\nNội dung B"
  - "### Cột C\nNội dung C"
:::
```

### Band (full-width banner)

```markdown
:::Div
type: "band"
title: "Liên hệ với chúng tôi"
subtitle: "Hỗ trợ 24/7"
content: |
  Hãy để lại thông tin, chúng tôi sẽ tư vấn miễn phí.
:::
```

## Template Builder Usage

```njk
{% from "bricks/div/molecules.njk" import renderSection, renderGrid, renderCard, renderFlexRow, renderBand %}

{{ renderSection("Nội dung section") }}

{{ renderCard(
  title="Tiêu đề thẻ",
  image="/images/photo.jpg",
  content="Nội dung thẻ"
) }}

{{ renderGrid(items=pageItems, cols=3) }}
```

## Comparison with `:::div` (native fenced container)

- `:::div {.class}` — native, xử lý bằng regex trong engine, không qua component system. Phù hợp cho khối HTML đơn giản, không cần logic.
- `:::Div` hoặc `{% Div %}` — qua component system, có thể dùng macro, props, và UnoCSS shortcuts. Phù hợp cho layout có cấu trúc (section, grid, card).


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::div
items: "posts | where({section: 'gioi-thieu'}) | limit(6)"
:::
```

Database globals có sẵn trong mọi filter expression:

| Global | Nguồn | Filters |
|---|---|---|
| `posts` | `database/posts.json` | `where`, `limit`, `first`, `last` |
| `pages` | `database/pages.json` | `where`, `limit`, `first`, `last` |
| `listings` | `database/listings.json` | `where`, `limit`, `first`, `last` |
| `projects` | `database/projects.json` | `where`, `limit`, `first`, `last` |
| `sales` | `database/sales.json` | `where`, `limit`, `first`, `last` |

> **Lưu ý:** Chỉ những string prop có chứa ký tự `|` mới được xử lý qua Nunjucks. Prop không chứa `|` giữ nguyên giá trị YAML thông thường.


## Changelog

### 2026-06-10
- **Thay đổi:** Đồng nhất namespace `ssg-*` / `mtt-*` / `hdr-*` → `bem-*`
- **Thay đổi:** Thêm cơ chế Filter Expression — props chứa `|` được render qua Nunjucks với database globals (`posts`, `pages`, `listings`, `projects`, `sales`)
- **Thay đổi:** Thêm `| dump` filter (JSON.stringify + JSON.parse) để resolve array/object từ Nunjucks expression
- **Lý do:** Cho phép dùng filter expression trong `:::` syntax thay vì hardcode dữ liệu
