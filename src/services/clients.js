const axios = require('axios');

/**
 * Gọi sang các service khác qua HTTP (SOA: không dùng chung CSDL).
 * >>> Điều chỉnh tên trường (price, cost_price, stock, items, ...) cho khớp với
 *     response thực tế của Product Service và Order Service của bạn. <<<
 */
const productApi = axios.create({ baseURL: process.env.PRODUCT_SERVICE_URL, timeout: 5000 });
const orderApi = axios.create({ baseURL: process.env.ORDER_SERVICE_URL, timeout: 5000 });

const withAuth = (token) => ({ headers: { Authorization: token } });

/** Trả về: { id, name, cost_price, stock } */
async function getProduct(productId, token) {
  const { data } = await productApi.get(`/products/${productId}`, withAuth(token));
  const p = data.product || data;
  return {
    id: p.id,
    name: p.name,
    cost_price: Number(p.cost_price ?? p.import_price ?? 0), // giá nhập
    stock: p.stock ?? p.quantity ?? null,                    // tồn kho
  };
}

/** Trả về: { id, items: [{ product_id, quantity, price }] } (price = giá bán) */
async function getOrder(orderId, token) {
  const { data } = await orderApi.get(`/orders/${orderId}`, withAuth(token));
  const o = data.order || data;
  const items = (o.items || o.order_items || []).map((i) => ({
    product_id: i.product_id,
    quantity: Number(i.quantity),
    price: Number(i.price ?? i.unit_price ?? 0),
  }));
  return { id: o.id, items };
}

module.exports = { getProduct, getOrder };
