const express = require('express');
const TOKEN = 'demo-token';

const auth = express();
auth.use(express.json());
auth.post('/auth/login', (req, res) => res.json({ token: TOKEN }));
auth.get('/auth/verify', (req, res) => {
  if (req.headers.authorization === `Bearer ${TOKEN}`) return res.json({ user: { id: 1, username: 'admin' } });
  res.status(401).json({ message: 'invalid token' });
});

const products = [
  { id: 1, name: 'Ao thun', cost_price: 100, price: 150, stock: 50 },
  { id: 2, name: 'Quan jean', cost_price: 180, price: 300, stock: 20 },
];
const prod = express();
prod.get('/products', (req, res) => res.json(products));
prod.get('/products/:id', (req, res) => {
  const p = products.find((x) => x.id === +req.params.id);
  p ? res.json(p) : res.status(404).json({ message: 'not found' });
});

const orders = [
  { id: 1, items: [{ product_id: 1, quantity: 2, price: 150 }, { product_id: 2, quantity: 1, price: 300 }] },
  { id: 2, items: [{ product_id: 1, quantity: 3, price: 150 }] },
];
const ord = express();
ord.get('/orders', (req, res) => res.json(orders));
ord.get('/orders/:id', (req, res) => {
  const o = orders.find((x) => x.id === +req.params.id);
  o ? res.json(o) : res.status(404).json({ message: 'not found' });
});

auth.listen(3002, () => console.log('Mock Auth    :3002'));
prod.listen(3001, () => console.log('Mock Product :3001'));
ord.listen(3003, () => console.log('Mock Order   :3003'));
