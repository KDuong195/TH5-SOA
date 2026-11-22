const axios = require('axios');

/**
 * Xác thực qua Auth Service (bài thực hành số 2).
 * Chuyển tiếp header Authorization sang Auth Service.
 * >>> Sửa đường dẫn /auth/verify cho khớp với API xác thực của bạn ở Bài 2. <<<
 * Auth Service trả 200 (kèm thông tin user) nếu token hợp lệ.
 */
module.exports = async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Thiếu token xác thực' });

  try {
    const { data } = await axios.get(`${process.env.AUTH_SERVICE_URL}/auth/verify`, {
      headers: { Authorization: header },
      timeout: 5000,
    });
    req.user = data.user || data;
    next();
  } catch (err) {
    if (err.response && [401, 403].includes(err.response.status)) {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    return res.status(502).json({ message: 'Không kết nối được Auth Service' });
  }
};
