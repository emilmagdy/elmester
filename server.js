require("dotenv").config()

const session = require("express-session")
const bcrypt = require("bcrypt")
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to the cloud database (Neon) using the connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Your Neon connection string
  ssl: {
    rejectUnauthorized: false // Required for secure Neon cloud connections
  },
  // 1. Connection Timeout: Time to wait for a new connection before throwing an error (set to 10 seconds)
  connectionTimeoutMillis: 10000, 
  
  // 2. Idle Timeout: Time a client can sit idle in the pool before being closed (set to 30 seconds)
  idleTimeoutMillis: 30000, 
  
  // 3. Max Clients: Maximum number of clients allowed inside the pool simultaneously
  max: 10 
});

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Middleware to parse the URL Encoded data embedded in the form body
app.use(express.urlencoded({extended: true}));

// Configure session middleware to track logged-in users
app.use(session({
    secret: 'EmilSuperSecretKey2026', // Secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // Session expires after 30 days (in milliseconds)
}));

// Middleware to protect the route from unautherized  users
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        res.redirect("/login")
    };
};

// ===================
// 1. Home Page Route
// ===================
app.get('/', (req, res) => {
    // Renders index.ejs which contains navigation buttons and platform features
    res.render('index'); 
});

// ==========================================
// 2. Teachers List Route
// ==========================================
app.get('/teachers', async (req, res) => {
    try {
        // Fetch all teachers from Neon PostgreSQL database ordered by newest first
        const result = await pool.query('SELECT * FROM teachers ORDER BY id DESC');
        
        // Pass the database rows to teachers-list.ejs view
        res.render('teachers', { teachers: result.rows }); 
    } catch (err) {
        console.error("Database fetch error:", err);
        res.status(500).send("Server Error: Status 500 - Failed to load teachers list");
    }
});
// ================================================================
// GET Route to render the form that will be used to input the data
// ================================================================

app.get("/admin-insert", (req,res) => {
    // Get the secret key from the URL Parameters
    const secretKey = req.query.secret;
    //Validate the secret Key
    if (secretKey === "EmilPassword123") {
        res.render("add-teacher")
    } else {
        res.status(403).send("Access Denied : Unautherized entry")
    }
});

// ====================================================
// Post Route : To send the form data into the database
// ====================================================

app.post("/admin-insert" , async (req, res) => {
    // Get the secret key from the URL Parameters
    const secretKey = req.query.secret;
    // Double Check to prevent direct attacks
    if (secretKey !== "EmilPassword123") {
       return  res.status(403).send("Access Denied : Unautherized entry")
    };
    try {
        // Destructure Name and Subject constants from the form body
        const {name , subject } = req.body;
        // Insert name and subject into the database
        const queryText = "INSERT INTO teachers (name,subject) VALUES ($1, $2)"
        await pool.query(queryText, [name,subject]);
        // Success : Redirect to hte homepage
        res.redirect("/")
    } catch (err) {
        console.error("Data insertion error", err);
        res.status(500).send("Server Error : Failed to save data")
    }});

// ===========================================
// GET Route for renderign the register page
// ===========================================

app.get("/register", (req,res) => {
    res.render("register")
});

// ===========================================================
// POST Route for saving the registrion data into the database
// ===========================================================

app.post("/register", async (req,res) =>{
    const {name, email , password ,grade } = req.body;
try{
    
    const exits = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (exits.rows.length > 0) {
        return res.status(400).send("This email is already registered. Please log in ")
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, grade) VALUES ($1, $2, $3, $4) RETURNING id, role',
            [name, email, hashedPassword, grade]
        );
     req.session.userId = newUser.rows[0].id;
     req.session.userRole = newUser.rows[0].role;
     res.redirect("/teachers");
    } catch (err) {
        console.error("Error during signup registration:", err);
        res.status(500).send("Internal server error. Please try again later.");
    }
    });

// ======================================
// GET Route for rendering the login page
// ======================================  

app.get("/login", (req, res) => {
    res.render("login")
});

// ===========================================
// POST Route for sending the login credntials
// ===========================================
 app.post("/login", (req, res) => {
    const {email, password} = req.body;
    const emailExits = pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (emailExits.rows.length == 0) {
        return res.status(400).send("Invalid Email or Password")
    }
 })


// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running successfully on: http://localhost:${PORT}`)
});
