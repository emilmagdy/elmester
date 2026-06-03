const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

// Connect to the cloud database (Neon) using the connection string
const connectionString = 'postgresql://neondb_owner:npg_EZThlU8pdHO7@ep-lingering-mountain-aqnj526z.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for secure cloud connection to Neon
});

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Middleware to parse the URL Encoded data embedded in the form body
app.use(express.urlencoded({extended: true}));


// Main route: Fetch teachers from the cloud and render them
app.get('/', async (req, res) => {
    try {
        // Query to select all records from the teachers table
        const result = await pool.query('SELECT * FROM teachers;');
        
        // Log the data in the terminal for debugging purposes
        console.log("Data retrieved successfully from cloud:", result.rows);
        
        // Send the JSON data to the browser directly
        res.render("index" , {teachers: result.rows});
    } catch (err) {
        // Log errors in the terminal if the connection fails
        console.error("Database connection error:", err);
        res.status(500).send("Error connecting to the database");
    }
});

// Route to render the form that will be used to input the data
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
// Post Route : To send the form data into the database
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
        const queryText = "INSERT INTO teachers (name,subject) VVALUES ($1, $2)"
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
