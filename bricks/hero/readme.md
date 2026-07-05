# Hero Brick Component

A full-width hero section with background image/color, title, subtitle, badge, and CTA buttons.

## Markdown Usage

:::Hero
backgroundImage: "/assets/images/bg-hero.jpg"
title: "Kiến tạo An cư – Vững bền Giá trị"
subtitle: "Đối tác tư vấn và phân phối bất động sản đô thị hàng đầu tại Hà Đông"
align: "center"
badge:
  text: "Chuyên gia bất động sản"
buttons:
  - label: "Khám phá ngay"
    url: "/du-an/"
    variant: "primary"
  - label: "Tìm hiểu thêm"
    url: "/lien-he/"
    variant: "secondary"
:::

## Template Builder

```njk
{% from "bricks/hero/molecules.njk" import renderHero %}
{{ renderHero({
  backgroundImage: "/assets/images/bg.jpg",
  title: "Tiêu đề Hero",
  subtitle: "Mô tả ngắn gọn",
  align: "center",
  buttons: [
    { label: "Xem thêm", url: "#", variant: "primary" }
  ]
}) }}
```


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::hero
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
