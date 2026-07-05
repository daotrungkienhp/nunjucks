# Divider Brick Component

Section divider/spacer with multiple variants: solid, dashed, gradient, dots, and line-with-label.

## Markdown Usage

:::Divider
variant: "dots"
size: "md"
:::

:::Divider
variant: "line-label"
label: "Hoặc"
:::

## Template Builder

```njk
{% from "bricks/divider/molecules.njk" import renderDivider %}
{{ renderDivider({ variant: "dots", size: "lg" }) }}
```

## Changelog

### 2026-06-10
- **Thay đổi:** Đồng nhất namespace `ssg-*` / `mtt-*` / `hdr-*` → `bem-*`
- **Thay đổi:** Thêm cơ chế Filter Expression — props chứa `|` được render qua Nunjucks với database globals (`posts`, `pages`, `listings`, `projects`, `sales`)
- **Thay đổi:** Thêm `| dump` filter (JSON.stringify + JSON.parse) để resolve array/object từ Nunjucks expression
- **Lý do:** Cho phép dùng filter expression trong `:::` syntax thay vì hardcode dữ liệu
