:::FAQs
title: "Câu hỏi thường gặp về Pháp Luân Công"
items:
  - question: "Học Pháp Luân Công có mất phí không?"
    answer: "Pháp Luân Công được hướng dẫn hoàn toàn **miễn phí** bởi các tình nguyện viên."
  - question: "Môn tu luyện này bao gồm những gì?"
    answer: "Môn tu luyện bao gồm phần **Tu** và phần **Luyện**."
:::

{% FAQs 
  title="Câu hỏi thường gặp về Pháp Luân Công", 
  titleId="cau-hoi", 
  titleClass="text-center",
  subtitle="Hỏi & Đáp",
  subtitleClass="text-center text-gray-500",
  items=[
    { question: "Học Pháp Luân Công có mất phí không?", answer: "Pháp Luân Công được hướng dẫn hoàn toàn **miễn phí** bởi các tình nguyện viên." }
  ]
%}


## demo builder 
{% from "bricks/faqs/molecules.njk" import renderFaqs %}
{{ renderFaqs(items, title, subtitle) }}


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::faqs
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
