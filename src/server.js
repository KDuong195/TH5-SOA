require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const reportRoutes = require('./routes/reports');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'))); // Dashboard tại http://localhost:3005/

app.get('/health', (req, res) => res.json({ service: 'reporting-service', status: 'ok' }));
app.use('/reports', reportRoutes);

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.response) { // lỗi khi gọi service khác
    return res.status(err.response.status === 404 ? 404 : 502)
      .json({ message: 'Lỗi từ service phụ thuộc', detail: err.response.data });
  }
  if (err.code === 'ECONNREFUSED') return res.status(502).json({ message: 'Không kết nối được service phụ thuộc' });
  res.status(500).json({ message: 'Lỗi máy chủ', detail: err.message });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Reporting service chạy tại http://localhost:${PORT}`));
