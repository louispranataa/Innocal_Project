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

// Initialize OAuth2Client with environment variables
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

// Middleware for session handling (must be before any routes)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set false for development without HTTPS
}));

// Middleware for enabling CORS and handling JSON body parsing
app.use(cors());
app.use(bodyParser.json());

// Serve static files (like CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve landing page (root route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'newlanding.html'));
});

// Serve signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Signup route - Handle user signups
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

// Calendar route - Only accessible if user is logged in
app.get('/calendar', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // Redirect to login if user is not logged in
    }
    res.sendFile(path.join(__dirname, 'cal.html')); // Serve calendar page
});

// Logout route - Destroy session and log out the user
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Could not log out');
        }
        res.send('Logged out');
    });
});

// Note route
app.get('/note', (req, res) => {
    res.sendFile(path.join(__dirname, 'note.html'));
});

// Reminder route
app.get('/reminder', (req, res) => {
    res.sendFile(path.join(__dirname, 'reminder.html'));
});

// Serve login page
app.get('/logins', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Google OAuth login route
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

// Callback route for Google OAuth login
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: 'http://localhost:3000/auth/google/callback',
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

        // Save user data in session
        req.session.user = {
            id: user.id,
            email: user.email,
            google_id: user.google_id,
        };

        console.log('Session after login:', req.session);

        // Redirect to calendar page after login
        res.redirect('/calendar');
    } catch (error) {
        console.error('Authentication Error:', error);
        res.status(500).send('Authentication failed');
    }
});

// Authentication middleware
function authenticate(req, res, next) {
    if (!req.session.user) {
        return res.status(401).send('You must be logged in');
    }
    next();
}

// API to fetch reminders for a specific date
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

// API to delete a reminder
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

// API to update a reminder
app.put('/reminders/:id', authenticate, async (req, res) => {
    const reminderId = req.params.id;
    const { title, description, reminder_date } = req.body;

    try {
        const result = await pool.query(
            'UPDATE reminders SET title = $1, description = $2, reminder_date = $3 WHERE id = $4 RETURNING *',
            [title, description, reminder_date, reminderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send('Reminder not found');
        }

        res.status(200).send('Reminder updated successfully');
    } catch (err) {
        console.error('Error updating reminder:', err);
        res.status(500).send('Error updating reminder');
    }
});

app.post('/add-event', async (req, res) => {
    const { title, description, time, reminder_date, created_at } = req.body;
  
    // Get the user_id from session
    const user_id = req.session.user_id;
  
    if (!user_id) {
      return res.status(401).send('User not authenticated');  // If no user is logged in
    }
  
    if (!title || !description || !time || !reminder_date || !created_at) {
      return res.status(400).send('All fields are required');
    }
  
    try {
      const query = 
        'INSERT INTO reminders (title, description, time, reminder_date, created_at, user_id) VALUES ($1, $2, $3, $4, $5, $6)';
      
      await pool.query(query, [title, description, time, reminder_date, created_at, user_id]);
      res.status(200).send('Event added successfully');
    } catch (error) {
      console.error('Database error:', error.message);
      res.status(500).send('Failed to add event');
    }
  });

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Validate user credentials (assuming you already do this part)
    
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
  
    if (result.rows.length > 0) {
      // Assuming password check is successful
      const user = result.rows[0];
      req.session.user_id = user.user_id;  // Store user_id in session
      res.status(200).send('Login successful');
    } else {
      res.status(400).send('Invalid credentials');
    }
  });

  // Middleware to verify the Google ID token
async function verifyGoogleToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from 'Authorization: Bearer <token>'
  
    if (!token) {
      return res.status(401).send('No token provided');
    }
  
    try {
      // Verify the token using Google OAuth2 client
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID, // Verify the token with your client ID
      });
  
      // Get the payload of the ID token (contains user information)
      const payload = ticket.getPayload();
      req.user = { user_id: payload.sub };  // The 'sub' field in the payload is the unique user ID
  
      next();  // Proceed to the next middleware (route handler)
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).send('Invalid or expired token');
    }
  }
  

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Route to send user_id stored in session
app.get('/get-user-id', (req, res) => {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).send('User not authenticated');
    }
    res.status(200).send({ user_id: req.session.user.id }); // Send user_id from session
  });
