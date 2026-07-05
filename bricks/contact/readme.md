# Contact Brick Component

Contact information block with methods (phone, email, address) and social media links.

## Markdown Usage

:::Contact
methods:
  - icon: '<svg>...</svg>'
    title: "Điện thoại"
    content: "0328.69.62.61"
    href: "tel:0328696261"
  - icon: '<svg>...</svg>'
    title: "Email"
    content: "info@kienancu.com"
    href: "mailto:info@kienancu.com"
  - icon: '<svg>...</svg>'
    title: "Địa chỉ"
    content: "Hà Đông, Hà Nội"
socials:
  - icon: '<svg>...</svg>'
    url: "#"
    label: "Facebook"
:::

## Template Builder

```njk
{% from "bricks/contact/molecules.njk" import renderContactInfo %}
{{ renderContactInfo({ methods: contacts }) }}
```


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::contact
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
