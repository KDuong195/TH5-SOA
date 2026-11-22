# Reporting Service – Bài thực hành số 5 (SOA)

## Chạy
```bash
npm install
cp .env.example .env      # sửa lại cổng / thông tin DB / URL các service
mysql -u root -p < schema.sql
npm start                 # mặc định http://localhost:3005
```

## API (header: `Authorization: Bearer <token>` lấy từ Auth Service – Bài 2)
| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | /reports/products[?product_id=] | Danh sách báo cáo sản phẩm |
| GET | /reports/products/:id | Chi tiết báo cáo sản phẩm |
| POST | /reports/products | Body `{order_report_id, product_id}` |
| DELETE | /reports/products/:id | Xoá báo cáo sản phẩm |
| GET | /reports/orders | Danh sách báo cáo đơn hàng |
| GET | /reports/orders/:id | Chi tiết (kèm báo cáo từng sản phẩm của đơn) |
| POST | /reports/orders | Body `{order_id}` – tự tạo luôn product_reports cho các dòng hàng |
| DELETE | /reports/orders/:id | Xoá báo cáo đơn (xoá cascade product_reports) |
| GET | /reports/summary | Tổng hợp doanh thu/chi phí/lợi nhuận/số lượng bán/tồn theo sản phẩm |

## Công thức
- revenue = Σ(quantity × giá bán trong đơn hàng)
- cost = Σ(quantity × giá nhập của sản phẩm)
- profit = revenue − cost

## Cần chỉnh cho khớp các bài trước
1. `src/middleware/auth.js`: đường dẫn verify của Auth Service (hiện `/auth/verify`).
2. `src/services/clients.js`: tên trường trả về của Product Service (giá nhập, tồn kho) và Order Service (items, price).
