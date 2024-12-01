const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const app = express();
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Initialize OAuth2Client with your Google Client ID and Client Secret
const oauth2Client = new OAuth2Client(
    '13995132651-23ot1ed35u74t971pk9erkmmlc7q3hg9.apps.googleusercontent.com',        // Replace with your actual Client ID
    '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'     // Replace with your actual Client Secret
);

// Middleware for enabling CORS and handling JSON request bodies
app.use(cors());
app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',  // Replace with a strong secret key
    resave: false,
    saveUninitialized: true
}));

// PostgreSQL database connection (using your existing innocal_db)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'innocal_db',  // Using your existing database innocal_db
    password: 'ferdi123',  // Replace with your actual PostgreSQL password
    port: 5432,
});

// Route to trigger Google OAuth login
app.get('/login', (req, res) => {
    console.log('Initiating Google OAuth flow...');
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
        redirect_uri: 'http://localhost:3000/auth/google/callback',  // Ensure this matches your Google Cloud Console settings
    });

    console.log('Generated Google OAuth URL: ', authUrl);
    res.redirect(authUrl);  // Redirect the user to Google's login page
});

// Callback route after Google login
app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query; // The authorization code Google sends after login

    console.log('Received authorization code:', code);  // Log the code to verify it's valid

    try {
        // Exchange the authorization code for an access token
        const { tokens } = await oauth2Client.getToken({
            code,
            redirect_uri: 'http://localhost:3000/auth/google/callback'  // Ensure this matches the Google Cloud Console
        });
        oauth2Client.setCredentials(tokens);

        // Log tokens to verify they are correct
        console.log('Tokens:', tokens);

        // Fetch the user's information using the access token
        const userInfo = await oauth2Client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        });

        console.log('Google User Info:', userInfo.data); // Log the user info to verify it's being fetched correctly

        // Check if the user already exists in the database by their Google ID
        let user = await pool.query('SELECT * FROM users WHERE google_id = $1', [userInfo.data.sub]);

        if (user.rows.length === 0) {
            // If the user doesn't exist, create a new record in the database
            console.log('New user detected, creating user...');
            const result = await pool.query(
                'INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING *',
                [userInfo.data.email, userInfo.data.sub]
            );
            user = result.rows[0];  // Newly created user
            console.log('User created in database:', user);
        } else {
            user = user.rows[0];  // Existing user
            console.log('Existing user found:', user);
        }

        // Save user info in session
        req.session.user = {
            id: user.id,
            email: user.email,
            google_id: user.google_id,  // Store the google_id in the session
        };

        console.log('User session set successfully.');
        res.send(`Hello, ${userInfo.data.name}`);  // Send a success message with the user's name
    } catch (error) {
        console.error('Authentication Error:', error);  // Log any authentication errors
        res.status(500).send('Authentication failed');
    }
});

// Middleware to ensure the user is authenticated before accessing certain routes
function authenticate(req, res, next) {
    if (!req.session.user) {
        console.log('User not authenticated, redirecting...');
        return res.status(401).send('You must be logged in');
    }
    next();
}

// API to create a new reminder (POST /reminders)
app.post('/reminders', authenticate, async (req, res) => {
    const { title, description, reminder_date, color } = req.body;
    const user_id = req.session.user.id;  // Use the logged-in user's ID

    console.log('Creating reminder for user:', user_id);
    try {
        const result = await pool.query(
            'INSERT INTO reminders (title, description, reminder_date, color, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, reminder_date, color, user_id]
        );
        res.status(201).json(result.rows[0]);  // Respond with the created reminder
    } catch (err) {
        console.error('Error creating reminder:', err);  // Log any error creating the reminder
        res.status(500).json({ error: err.message });
    }
});

// API to get reminders for a specific date (GET /reminders)
app.get('/reminders', authenticate, async (req, res) => {
    const user_id = req.session.user.id;  // Use the logged-in user's ID
    const { date } = req.query;

    console.log(`Fetching reminders for user ${user_id} on ${date}`);
    try {
        const result = await pool.query(
            'SELECT * FROM reminders WHERE reminder_date::date = $1 AND user_id = $2',
            [date, user_id]
        );
        res.json(result.rows);  // Respond with the list of reminders
    } catch (err) {
        console.error('Error fetching reminders:', err);  // Log any error fetching the reminders
        res.status(500).json({ error: err.message });
    }
});

// API to delete a reminder (DELETE /reminders/:id)
app.delete('/reminders/:id', authenticate, async (req, res) => {
    const user_id = req.session.user.id;  // Use the logged-in user's ID
    const { id } = req.params;

    console.log(`Deleting reminder with ID ${id} for user ${user_id}`);
    try {
        await pool.query('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [id, user_id]);
        res.status(204).send();  // Successfully deleted the reminder
    } catch (err) {
        console.error('Error deleting reminder:', err);  // Log any error deleting the reminder
        res.status(500).json({ error: err.message });
    }
});

// Route to log out the user (destroy session)
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);  // Log any logout errors
            return res.status(500).send('Could not log out');
        }
        console.log('User logged out successfully');
        res.send('Logged out');
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
