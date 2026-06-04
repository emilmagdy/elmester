require("dotenv").config()

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


// ==========================================
// 1. Home Page Route
// ==========================================
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
        res.render('teachers-list', { teachers: result.rows }); 
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



// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running successfully on: http://localhost:${PORT}`)
});
