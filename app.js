const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Izinkan akses dari frontend
app.use(bodyParser.json());
app.use(express.static('public')); // Folder untuk file HTML dan CSS

// Konfigurasi Database PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'innocal_project',
  password: 'loisdepari1111',
  port: 5432,
});

// Route Sign-Up
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database
    const result = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User created successfully!', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user!' });
  }
});

// Route Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Periksa apakah user ada
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const user = result.rows[0];

    // Periksa password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials!' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, 'secretkey', { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in!' });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
