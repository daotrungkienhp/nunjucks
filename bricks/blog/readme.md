# Blog Brick Component

Blog post listing grid with featured image, category badge, date, author, title, excerpt, and read more link.

## Markdown Usage

:::BlogPosts
cols: 3
items:
  - image: "/assets/images/blog-1.jpg"
    title: "Kinh nghiệm mua nhà Hà Đông"
    excerpt: "Những lưu ý quan trọng khi mua bất động sản tại Hà Đông"
    url: "/blog/kinh-nghiem-mua-nha/"
    date: "15/03/2025"
    category: "Kiến thức"
    author: "Kiến An Cư"
:::

## Template Builder

```njk
{% from "bricks/blog/molecules.njk" import renderBlogPosts %}
{{ renderBlogPosts({ items: posts, cols: 2 }) }}
```


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::blog
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
