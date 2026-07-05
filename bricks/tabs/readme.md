# Tabs Brick Component

An interactive tab navigation component styled according to the midnight blue / gold design system and driven by AlpineJS.

## Component Layout Structure
```
bricks/tabs/
├── atoms.njk          # Individual tab links and active states
├── atoms.uno.json     # Atom element styling shortcuts
├── molecules.njk      # Composed navigation header and content panels
├── molecules.uno.json  # Composed layout styling shortcuts
└── readme.md          # Documentation and component demo blocks
```

## Markdown Usage Example

You can render this component inside any markdown file (`index.md`) using the `:::Tabs` component container syntax:

:::Tabs
items:
  - label: "Profile"
    content: "Đây là nội dung của thẻ **Profile**. Bạn có thể viết bất kỳ nội dung Markdown nào ở đây!"
  - label: "Dashboard"
    content: "Đây là nội dung của thẻ **Dashboard**.\n- Dự án 1: Lacasta Văn Phú\n- Dự án 2: ParkCity Hà Nội"
  - label: "Settings"
    content: "Đây là nội dung của thẻ **Settings**."
  - label: "Contacts"
    content: "Đây là nội dung của thẻ **Contacts**."
  - label: "Disabled"
    disabled: true
:::


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::tabs
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
