const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// Pass the database pool dependency into the routing module
module.exports = (pool) => {

    // GET: Render the signup registration page
    router.get('/signup', (req, res) => {
        res.render('signup'); 
    });

    // POST: Handle the registration form submission
    router.post('/signup', async (req, res) => {
        const { name, email, password, grade } = req.body;

        try {
            // 1. Check if the email already exists in the database
            const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userExists.rows.length > 0) {
                return res.status(400).send('This email is already registered. Please log in.');
            }

            // 2. Hash the password using bcrypt with 10 salt rounds for security
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Insert the new user data into the database
            const newUser = await pool.query(
                'INSERT INTO users (name, email, password_hash, grade) VALUES ($1, $2, $3, $4) RETURNING id, role',
                [name, email, hashedPassword, grade]
            );

            // 4. Automatically log the user in by initializing the session variables
            req.session.userId = newUser.rows[0].id;
            req.session.userRole = newUser.rows[0].role;

            // 5. Redirect the student directly to the teachers catalog page
            res.redirect('/teachers');

        } catch (err) {
            console.error("Error during signup execution:", err);
            res.status(500).send("Internal server error. Please try again later.");
        }
    });

    // Return the configured router instance
    return router;
};