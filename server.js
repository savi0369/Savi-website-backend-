const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MySQL Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agency_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test DB Connection and Create Table if not exists
async function initDB() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        service VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log('Database connected successfully & table verified.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}
initDB();

// Health Check Route
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Savi Agency Backend is running smoothly! 🚀' });
});

// Handle Client Inquiries / Booking
app.get('/api/inquiries', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, service, created_at FROM inquiries ORDER BY created_at DESC LIMIT 10');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/inquire', async (req, res) => {
  const { name, email, service, message } = req.body;
  if (!name || !email || !service || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO inquiries (name, email, service, message) VALUES (?, ?, ?, ?)',
      [name, email, service, message]
    );
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully!', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
