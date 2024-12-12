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
        const query = date
            ? 'SELECT * FROM reminders WHERE reminder_date::date = $1 AND user_id = $2'
            : 'SELECT * FROM reminders WHERE user_id = $1';
        const params = date ? [date, user_id] : [user_id];

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reminders:', err);
        res.status(500).json({ error: 'Failed to fetch reminders' });
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

// POST /reminders to add a new reminder
app.post('/reminders', authenticate, async (req, res) => {
    const { title, description, time, day, month, year } = req.body;
    const user_id = req.session.user.id;

    try {
        // Combine day, month, and year into a single date
        const reminder_date = `${year}-${month}-${day}`;

        // Insert the reminder into the reminders table
        const result = await pool.query(
            `INSERT INTO reminders (user_id, title, description, time, reminder_date) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, title, description, time, reminder_date]
        );

        res.status(201).json(result.rows[0]); // Return the newly added reminder
    } catch (err) {
        console.error('Error adding reminder:', err);
        res.status(500).json({ error: 'Failed to add reminder' });
    }
});

// GET /reminders to retrieve reminders for a specific date
app.get('/reminders', authenticate, async (req, res) => {
    const user_id = req.session.user.id;
    const { day, month, year } = req.query;

    try {
        const reminder_date = `${year}-${month}-${day}`;
        const result = await pool.query(
            `SELECT * FROM reminders WHERE user_id = $1 AND reminder_date = $2`,
            [user_id, reminder_date]
        );

        res.json(result.rows); // Return the reminders for that date
    } catch (err) {
        console.error('Error fetching reminders:', err);
        res.status(500).json({ error: 'Failed to fetch reminders' });
    }
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

app.delete('/reminders', authenticate, async (req, res) => {
    const { title, day, month, year } = req.body;
    const user_id = req.session.user.id;

    try {
        const reminder_date = `${year}-${month}-${day}`;
        const result = await pool.query(
            `DELETE FROM reminders WHERE user_id = $1 AND title = $2 AND reminder_date = $3 RETURNING *`,
            [user_id, title, reminder_date]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

app.delete('/reminders', authenticate, async (req, res) => {
    const { title, description, time, reminder_date } = req.body;
    const user_id = req.session.user.id;

    console.log('DELETE request received with data:', { title, description, time, reminder_date, user_id });

    try {
        const reminder_date = `${year}-${month}-${day}`;
        console.log('Attempting to delete reminder with date:', reminder_date);

        // Execute the DELETE query
        const result = await pool.query(
            'DELETE FROM reminders WHERE user_id = $1 AND title = $2 AND reminder_date = $3 AND description = $4 AND time = $5 RETURNING *',
            [user_id, title, reminder_date, description, time]
        );

        console.log('Query result:', result);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting reminder:', err);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

app.put('/reminders/:id', async (req, res) => {
    const { id } = req.params; // Reminder ID from the URL
    const { title, time } = req.body; // Updated title and time from the request body

    if (!title || !time) {
        return res.status(400).json({ error: 'Title and time are required.' });
    }

    try {
        // Update the reminder in the database
        const result = await pool.query(
            'UPDATE reminders SET title = $1, time = $2 WHERE id = $3 RETURNING *',
            [title, time, id]
        );

        // Check if the reminder exists
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Reminder not found.' });
        }

        // Return the updated reminder
        const updatedReminder = result.rows[0];
        res.status(200).json({ message: 'Reminder updated successfully.', reminder: updatedReminder });
    } catch (err) {
        console.error('Error updating reminder:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});
