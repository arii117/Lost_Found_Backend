const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { LostItem, FoundItem } = require('./models');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors({ 
  origin: 'https://lost-found-frontend-eosin.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Admin Login Route
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;
  const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!match) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
  res.status(200).json({ token });
});

// Middleware to Verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err) => {
    if (err) return res.sendStatus(403);
    next();
  });
};

// Routes
app.get('/lost', async (req, res) => {
  try {
    const lostItems = await LostItem.findAll();
    res.status(200).json(lostItems);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).send('Error fetching lost items');
  }
});

app.get('/found', async (req, res) => {
  try {
    const foundItems = await FoundItem.findAll();
    res.status(200).json(foundItems);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).send('Error fetching found items');
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
