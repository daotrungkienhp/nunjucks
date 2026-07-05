# Card Brick Component

Card component for displaying projects, services, blog posts, team members, etc. Includes image, badge, meta data, title, description, and link.

## Markdown Usage

:::CardGrid
cols: 3
items:
  - image: "/assets/images/project-1.jpg"
    title: "Lacasta Văn Phú"
    description: "Khu đô thị hiện đại tại Hà Đông với không gian sống xanh"
    url: "/du-an/lacasta-van-phu/"
    linkText: "Xem chi tiết"
    badge: "Nổi bật"
    meta:
      - text: "Hà Đông"
      - text: "3.5 ha"
:::

## Template Builder

```njk
{% from "bricks/card/molecules.njk" import renderCardGrid %}
{{ renderCardGrid(pages, 3) }}
```


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::card
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
