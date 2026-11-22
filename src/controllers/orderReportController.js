const db = require('../config/db');
const { getOrder, getProduct } = require('../services/clients');

const round = (n) => Math.round(n * 100) / 100;

// GET /reports/orders
exports.list = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders_reports ORDER BY id DESC');
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /reports/orders/:id  (kèm chi tiết báo cáo từng sản phẩm của đơn)
exports.getById = async (req, res, next) => {
  try {
    const [[report]] = await db.query('SELECT * FROM orders_reports WHERE id = ?', [req.params.id]);
    if (!report) return res.status(404).json({ message: 'Không tìm thấy báo cáo đơn hàng' });
    const [products] = await db.query('SELECT * FROM product_reports WHERE order_report_id = ?', [report.id]);
    res.json({ ...report, products });
  } catch (e) { next(e); }
};

// POST /reports/orders   body: { "order_id": 1 }
exports.create = async (req, res, next) => {
  const orderId = Number(req.body.order_id);
  if (!orderId) return res.status(400).json({ message: 'Thiếu order_id' });

  const conn = await db.getConnection();
  try {
    const [[existing]] = await conn.query('SELECT id FROM orders_reports WHERE order_id = ?', [orderId]);
    if (existing) return res.status(409).json({ message: 'Đơn hàng này đã có báo cáo', id: existing.id });

    const token = req.headers.authorization;
    const order = await getOrder(orderId, token);
    if (!order.items.length) return res.status(400).json({ message: 'Đơn hàng không có sản phẩm' });

    // Tính doanh thu / chi phí / lợi nhuận từng sản phẩm
    const lines = [];
    for (const item of order.items) {
      const product = await getProduct(item.product_id, token);
      const revenue = round(item.quantity * item.price);
      const cost = round(item.quantity * product.cost_price);
      lines.push({
        product_id: item.product_id,
        total_sold: item.quantity,
        revenue, cost,
        profit: round(revenue - cost),
        stock_remaining: product.stock,
      });
    }
    const total_revenue = round(lines.reduce((s, l) => s + l.revenue, 0));
    const total_cost = round(lines.reduce((s, l) => s + l.cost, 0));
    const total_profit = round(total_revenue - total_cost);

    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO orders_reports (order_id, total_revenue, total_cost, total_profit) VALUES (?,?,?,?)',
      [orderId, total_revenue, total_cost, total_profit]
    );
    for (const l of lines) {
      await conn.query(
        `INSERT INTO product_reports
         (order_report_id, product_id, total_sold, revenue, cost, profit, stock_remaining)
         VALUES (?,?,?,?,?,?,?)`,
        [r.insertId, l.product_id, l.total_sold, l.revenue, l.cost, l.profit, l.stock_remaining]
      );
    }
    await conn.commit();

    res.status(201).json({ id: r.insertId, order_id: orderId, total_revenue, total_cost, total_profit, products: lines });
  } catch (e) {
    await conn.rollback().catch(() => {});
    next(e);
  } finally {
    conn.release();
  }
};

// DELETE /reports/orders/:id  (product_reports xoá theo nhờ ON DELETE CASCADE)
exports.remove = async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM orders_reports WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Không tìm thấy báo cáo đơn hàng' });
    res.json({ message: 'Đã xoá báo cáo đơn hàng' });
  } catch (e) { next(e); }
};
