:::Sliders
items:
  - image: /assets/images/anh1.png
    title: "Chân tướng cuộc đàn áp Pháp Luân Công"
    description: "Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần"
    url: "/ve-dep-chan-thien-nhan/"
    type: "image"
  - image: /assets/images/anh2.png
    title: "Chân tướng cuộc đàn áp Pháp Luân Công"
    description: "“Chân-Thiện-Nhẫn” là Phật Pháp, “là tiêu chuẩn duy nhất” để nhận định một người là tốt hay xấu. Một người Chân thành, Thiện lương, Nhẫn nhịn là một người tốt, một người có Đức."
    url: "/ve-dep-chan-thien-nhan/"
    type: "image"
  - image: /assets/images/anh1.png
    title: "Vì sao triển lãm nghệ thuật Chân Thiện Nhẫn chạm đến trái tim?"
    description: "Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần"
    url: "/ve-dep-chan-thien-nhan/"
    type: "image"
  - image: /assets/images/anh2.png
    title: "Vì sao triển lãm nghệ thuật Chân Thiện Nhẫn chạm đến trái tim?"
    description: "Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần"
    url: "/ve-dep-chan-thien-nhan/"
    type: "image"
  - image: /assets/images/anh1.png
    title: "Vì sao triển lãm nghệ thuật Chân Thiện Nhẫn chạm đến trái tim?"
    description: "Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần"
    url: "/ve-dep-chan-thien-nhan/"
    type: "image"
  - image: /assets/images/anh2.png
    title: "Vì sao triển lãm nghệ thuật Chân Thiện Nhẫn chạm đến trái tim?"
    description: "Khám phá sự kết nối sâu sắc giữa Nghệ Thuật và Tinh Thần"
    url: "/ve-dep-chan-thien-nhan/"
    type: "image"
:::


## Filter Expressions

Có thể dùng Nunjucks filter expressions thay vì hardcode dữ liệu — dữ liệu được query từ database JSON tự động:

```markdown
:::slider
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
