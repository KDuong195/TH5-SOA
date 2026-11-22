const router = require('express').Router();
const authenticate = require('../middleware/auth');
const products = require('../controllers/productReportController');
const orders = require('../controllers/orderReportController');

router.use(authenticate); // mọi API đều yêu cầu xác thực qua Auth Service

router.get('/summary', products.summary);

router.get('/products', products.list);
router.get('/products/:id', products.getById);
router.post('/products', products.create);
router.delete('/products/:id', products.remove);

router.get('/orders', orders.list);
router.get('/orders/:id', orders.getById);
router.post('/orders', orders.create);
router.delete('/orders/:id', orders.remove);

module.exports = router;
