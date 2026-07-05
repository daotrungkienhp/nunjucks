# Steps Brick Component

Process/steps timeline with numbered markers and connecting line.

## Markdown Usage

:::Steps
align: "left"
items:
  - title: "Tư vấn & Khảo sát"
    description: "Đội ngũ chuyên gia tư vấn và khảo sát nhu cầu thực tế"
  - title: "Phân tích & Đề xuất"
    description: "Phân tích dòng tiền, pháp lý và đề xuất giải pháp phù hợp"
  - title: "Hỗ trợ & Bàn giao"
    description: "Hoàn thiện thủ tục và bàn giao đúng tiến độ"
:::

## Template Builder

```njk
{% from "bricks/steps/molecules.njk" import renderSteps %}
{{ renderSteps({ items: processSteps }) }}
```


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::steps
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
