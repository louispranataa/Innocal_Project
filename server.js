require('dotenv').config(); // Load .env variables

const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();

// PostgreSQL database connection using DATABASE_URL from .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Inisialisasi OAuth2Client dengan environment variables
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// Middleware untuk session harus ada sebelum route lainnya
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Harus false untuk development tanpa HTTPS
}));

// Middleware untuk enabling CORS dan menangani request body JSON
app.use(cors());
app.use(bodyParser.json());

// Rute untuk menyajikan halaman static (seperti file CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve landing page (root route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'newlanding.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.post('/signups', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashedPassword]
        );

        res.status(201).json({ message: 'Sign up successful!', userId: result.rows[0].id });
    } catch (error) {
        console.error(error);

        if (error.code === '23505') {
            return res.status(400).json({ message: 'Username already exists' });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
});

  
  

// Calendar route
app.get('/calendar', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // Jika user belum login, arahkan ke halaman login
    }
    res.sendFile(path.join(__dirname, 'cal.html')); // Kirim file cal.html ke user
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Could not log out');
        }
        res.send('Logged out');
    });
});

app.get('/note', (req, res) => {
    res.sendFile(path.join(__dirname, 'note.html'));
});
app.get('/pengingat', (req, res) => {
    res.sendFile(path.join(__dirname, 'pengingat.html'));
});

// Serve login page
app.get('/logins', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route untuk memulai login menggunakan Google OAuth
app.get('/login', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        redirect_uri: 'http://localhost:3000/auth/google/callback',
    });

    res.redirect(authUrl);
});


// Callback route setelah login Google
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: 'http://localhost:3000/auth/google/callback', // pastikan ini sesuai dengan yang ada di Google OAuth
        });
        oauth2Client.setCredentials(tokens);

        const userInfo = await oauth2Client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });

        let user = await pool.query('SELECT * FROM users WHERE google_id = $1', [userInfo.data.sub]);

        if (user.rows.length === 0) {
            const result = await pool.query(
                'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING *',
                [userInfo.data.email, userInfo.data.sub]
            );
            user = result.rows[0];
        } else {
            user = user.rows[0];
        }

        // Setelah login sukses, simpan data user dalam session
        req.session.user = {
            id: user.id,
            email: user.email,
            google_id: user.google_id,
        };

        console.log('Session after login:', req.session); // Debugging

        // Redirect ke /calendar setelah login
        res.redirect('/calendar');
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Middleware untuk autentikasi
function authenticate(req, res, next) {
    if (!req.session.user) {
        return res.status(401).send('You must be logged in');
    }
    next();
}

// API untuk mengambil reminder berdasarkan tanggal
app.get('/reminders', authenticate, async (req, res) => {
    const user_id = req.session.user.id;
    const { date } = req.query;

    try {
        const result = await pool.query(
            'SELECT * FROM reminders WHERE reminder_date::date = $1 AND user_id = $2',
            [date, user_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reminders:', err);
        res.status(500).json({ error: err.message });
    }
});

// API untuk menghapus reminder
app.delete('/reminders/:id', authenticate, async (req, res) => {
    const user_id = req.session.user.id;
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [id, user_id]);
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting reminder:', err);
        res.status(500).json({ error: err.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

//login lokal
app.post('/login-local', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Cari user di database
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.rows[0];

        // Bandingin password yang diinput user sama yang di database
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Kalau valid, simpen session user
        req.session.user = {
            id: user.id,
            username: user.username,
        };

        res.status(200).json({ message: 'Login successful!', token: 'dummy-token' }); // Bisa ganti token-nya
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error'});
}
});