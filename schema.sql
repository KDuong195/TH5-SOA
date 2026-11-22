CREATE DATABASE IF NOT EXISTS reporting_db CHARACTER SET utf8mb4;
USE reporting_db;

CREATE TABLE IF NOT EXISTS orders_reports (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost    DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_profit  DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order (order_id)
);

CREATE TABLE IF NOT EXISTS product_reports (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_report_id INT NOT NULL,
  product_id      INT NOT NULL,
  total_sold      INT NOT NULL DEFAULT 0,
  revenue         DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost            DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit          DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_remaining INT NULL COMMENT 'Số lượng tồn tại thời điểm lập báo cáo (mở rộng để thống kê hàng tồn)',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_product (order_report_id, product_id),
  CONSTRAINT fk_pr_order_report FOREIGN KEY (order_report_id)
    REFERENCES orders_reports(id) ON DELETE CASCADE
);
