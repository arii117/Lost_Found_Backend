const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { LostItem, FoundItem, sequelize } = require('./models');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT secret and hashed password (store hashed password in .env)
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // Hashed admin password

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

const password = 'arya'; 
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hashed password:', hash);
});



// Admin login route
app.post('/admin/login', async (req, res) => {
  const { password } = req.body;

  try {
    // Compare password with stored hash
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    // Create JWT token
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '30d' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes (protected with authenticateToken middleware)
app.post('/lost',  async (req, res) => {
  try {
    const lostItem = await LostItem.create(req.body);
    res.status(201).json(lostItem);
  } catch (error) {
    console.error('Error saving lost item:', error);
    res.status(500).send('Error saving lost item');
  }
});

app.post('/found', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { itemName, date, roomNo } = req.body;
    const image = req.file.filename;
    const foundItem = await FoundItem.create({ itemName, image, date, roomNo });
    res.status(200).json(foundItem);
  } catch (error) {
    console.error('Error saving found item:', error);
    res.status(500).send('Error saving found item');
  }
});

// Fetch Lost Items
app.get('/lost',  async (req, res) => {
  try {
    const lostItems = await LostItem.findAll();
    res.status(200).json(lostItems);
  } catch (error) {
    console.error('Error fetching lost items:', error);
    res.status(500).send('Error fetching lost items');
  }
});

// Fetch Found Items
app.get('/found', authenticateToken, async (req, res) => {
  try {
    const foundItems = await FoundItem.findAll();
    res.status(200).json(foundItems);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).send('Error fetching found items');
  }
});

// Send Email
app.post('/send-email', authenticateToken, async (req, res) => {
  const { to, subject, text } = req.body;
  
  if (!to || !subject || !text) {
    return res.status(400).json({ message: 'Missing required email fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });

    const mailOptions = {
      from: `Lost and Found System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    // Test the connection first
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP Verification failed:', verifyError);
      throw new Error('Failed to connect to email server: ' + verifyError.message);
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      message: 'Error sending email',
      error: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

