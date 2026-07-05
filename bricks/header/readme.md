:::Header
items:
  - label: "Trang chủ"
    url: "/"
  - label: "Dịch vụ"
    url: "#"
    children:
      - label: "Tư vấn"
        url: "/tu-van/"
      - label: "Đào tạo"
        url: "/dao-tao/"
  - label: "Liên hệ"
    url: "/lien-he/"
:::

## template builder 
```njk
{% from "bricks/header/atoms.njk" import renderLogo %}
{% from "bricks/header/molecules.njk" import renderNavItem %}

<div class="border border-stone-200/60 dark:border-stone-800 rounded-2xl overflow-hidden p-6 bg-stone-50 dark:bg-stone-950/20">
  <div class="flex items-center justify-between">
    {{ renderLogo("text", "DEMO BRAND", "#") }}
    <div class="flex items-center space-x-2">
      {% for item in items %}
        {{ renderNavItem(item) }}
      {% endfor %}
    </div>
  </div>
</div>
```
## Changelog

### 2026-06-10
- **Thay đổi:** Đồng nhất namespace `ssg-*` / `mtt-*` / `hdr-*` → `bem-*`
- **Thay đổi:** Thêm cơ chế Filter Expression — props chứa `|` được render qua Nunjucks với database globals (`posts`, `pages`, `listings`, `projects`, `sales`)
- **Thay đổi:** Thêm `| dump` filter (JSON.stringify + JSON.parse) để resolve array/object từ Nunjucks expression
- **Lý do:** Cho phép dùng filter expression trong `:::` syntax thay vì hardcode dữ liệu
