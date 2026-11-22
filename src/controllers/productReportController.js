const db = require('../config/db');
const { getOrder, getProduct } = require('../services/clients');

const round = (n) => Math.round(n * 100) / 100;

// GET /reports/products            (lọc tuỳ chọn: ?product_id=5)
exports.list = async (req, res, next) => {
  try {
    const params = [];
    let sql = 'SELECT * FROM product_reports';
    if (req.query.product_id) { sql += ' WHERE product_id = ?'; params.push(req.query.product_id); }
    const [rows] = await db.query(sql + ' ORDER BY id DESC', params);
    res.json(rows);
  } catch (e) { next(e); }
};

// GET /reports/products/:id
exports.getById = async (req, res, next) => {
  try {
    const [[row]] = await db.query('SELECT * FROM product_reports WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Không tìm thấy báo cáo sản phẩm' });
    res.json(row);
  } catch (e) { next(e); }
};

// POST /reports/products   body: { "order_report_id": 1, "product_id": 5 }
// Tạo báo cáo cho 1 sản phẩm trong 1 đơn đã có báo cáo
// (dữ liệu lấy từ Order Service + Product Service).
exports.create = async (req, res, next) => {
  const orderReportId = Number(req.body.order_report_id);
  const productId = Number(req.body.product_id);
  if (!orderReportId || !productId) {
    return res.status(400).json({ message: 'Thiếu order_report_id hoặc product_id' });
  }
  try {
    const [[orderReport]] = await db.query('SELECT * FROM orders_reports WHERE id = ?', [orderReportId]);
    if (!orderReport) return res.status(404).json({ message: 'Không tìm thấy báo cáo đơn hàng' });

    const [[dup]] = await db.query(
      'SELECT id FROM product_reports WHERE order_report_id = ? AND product_id = ?', [orderReportId, productId]);
    if (dup) return res.status(409).json({ message: 'Báo cáo sản phẩm này đã tồn tại', id: dup.id });

    const token = req.headers.authorization;
    const order = await getOrder(orderReport.order_id, token);
    const items = order.items.filter((i) => i.product_id === productId);
    if (!items.length) return res.status(400).json({ message: 'Sản phẩm không thuộc đơn hàng này' });

    const product = await getProduct(productId, token);
    const total_sold = items.reduce((s, i) => s + i.quantity, 0);
    const revenue = round(items.reduce((s, i) => s + i.quantity * i.price, 0));
    const cost = round(total_sold * product.cost_price);
    const profit = round(revenue - cost);

    const [r] = await db.query(
      `INSERT INTO product_reports
       (order_report_id, product_id, total_sold, revenue, cost, profit, stock_remaining)
       VALUES (?,?,?,?,?,?,?)`,
      [orderReportId, productId, total_sold, revenue, cost, profit, product.stock]
    );
    res.status(201).json({
      id: r.insertId, order_report_id: orderReportId, product_id: productId,
      total_sold, revenue, cost, profit, stock_remaining: product.stock,
    });
  } catch (e) { next(e); }
};

// DELETE /reports/products/:id
exports.remove = async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM product_reports WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Không tìm thấy báo cáo sản phẩm' });
    res.json({ message: 'Đã xoá báo cáo sản phẩm' });
  } catch (e) { next(e); }
};

// GET /reports/summary — thống kê tổng hợp: hàng bán, doanh thu, chi phí, lợi nhuận, tồn theo sản phẩm
exports.summary = async (req, res, next) => {
  try {
    const [byProduct] = await db.query(
      `SELECT product_id,
              SUM(total_sold) AS total_sold, SUM(revenue) AS revenue,
              SUM(cost) AS cost, SUM(profit) AS profit,
              (SELECT stock_remaining FROM product_reports p2
                 WHERE p2.product_id = p.product_id ORDER BY p2.id DESC LIMIT 1) AS stock_remaining
       FROM product_reports p GROUP BY product_id ORDER BY product_id`);
    const [[totals]] = await db.query(
      `SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_revenue),0) AS total_revenue,
              COALESCE(SUM(total_cost),0) AS total_cost, COALESCE(SUM(total_profit),0) AS total_profit
       FROM orders_reports`);
    res.json({ totals, by_product: byProduct });
  } catch (e) { next(e); }
};
