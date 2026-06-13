require("dotenv").config()

const session = require("express-session")
const bcrypt = require("bcrypt")
const express = require('express');
const { Pool } = require('pg');
const app = express();
const flash = require("connect-flash")
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
app.use(express.urlencoded({ extended: true }));

// Configure session middleware to track logged-in users
app.use(session({
    secret: 'EmilSuperSecretKey2026', // Secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // Session expires after 30 days (in milliseconds)
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    next()
});

// Middleware to [ass session data to all ejs views
app.use((req, res, next) => {
    res.locals.userSession = req.session;
    next();
});


// Middleware to protect the route from unautherized  users
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        req.flash("error_msg", "برجاء تسجيل الدخول اولا")
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
app.get('/teachers', async (req, res, next) => {
    const { subject, sort } = req.query;
    try {
        let queryText = `
            SELECT t.*,
                   COALESCE(ROUND(AVG(r.rating), 1), 0.0) as avg_rating ,
                   COUNT(r.id) as total_reviews
            FROM teachers t
            LEFT JOIN reviews r ON t.id = r.teacher_id AND r.status = 'approved'
            `;

        const queryParams = []

        if (subject && subject !== "all") {
            queryText += " WHERE t.subject = $1";
            queryParams.push(subject);
        };
        queryText += " GROUP BY t.id";

        if (sort === "rating_desc") {
            queryText += " ORDER BY avg_rating DESC , total_reviews DESC";
        } else if (sort === "rating_asc") {
            queryText += " ORDER BY avg_rating ASC , total_reviews DESC";
        } else {
            queryText += " ORDER BY t.name ASC";
        };

        const [result, subjectRows] = await Promise.all([
            pool.query(queryText, queryParams),
            pool.query("SELECT DISTINCT subject FROM teachers ORDER BY subject")]);
        const subjectList = subjectRows.rows.map(row => row.subject);

        res.render('teachers', {
            teachers: result.rows,
            selectedSort: sort || "default",
            selectedSubject: subject || "all",
            subjects: subjectList
        });
    } catch (err) {
        next(err)
    }
});

// ================================================================
// GET Route to render the form that will be used to input the data
// ================================================================

app.get("/admin-insert", (req, res) => {
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

app.post("/admin-insert", async (req, res, next) => {
    // Get the secret key from the URL Parameters
    const secretKey = req.query.secret;
    // Double Check to prevent direct attacks
    if (secretKey !== "EmilPassword123") {
        return res.status(403).send("Access Denied : Unautherized entry")
    };
    try {
        // Destructure Name and Subject constants from the form body
        const { name, subject } = req.body;
        // Insert name and subject into the database
        const queryText = "INSERT INTO teachers (name,subject) VALUES ($1, $2)"
        await pool.query(queryText, [name, subject]);
        // Success : Redirect to hte homepage
        res.redirect("/")
    } catch (err) {
        next(err)
    }
});

// ===========================================
// GET Route for renderign the register page
// ===========================================

app.get("/register", (req, res) => {
    res.render("register")
});

// ===========================================================
// POST Route for saving the registrion data into the database
// ===========================================================

app.post("/register", async (req, res, next) => {
    let { name, email, password, grade } = req.body;
    try {
        email = email.trim().toLowerCase()
        const exits = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (exits.rows.length > 0) {
            req.flash("error_msg", "هذا البريد الالكترونى مسجل من قبل برجاء تسجيل الدخول")
            return res.redirect("/login")
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, grade) VALUES ($1, $2, $3, $4) RETURNING id, role,name',
            [name, email, hashedPassword, grade]
        );
        req.session.userId = newUser.rows[0].id;
        req.session.userRole = newUser.rows[0].role;
        req.session.userName = newUser.rows[0].name;
        req.session.save((err) => {
            if (err) {
                return next(err)
            }
            req.flash("success_msg", "لقد تم انشاء الحساب بنجاح برجاء تسجيل الدخول")
            res.redirect("/teachers");
        });
    } catch (err) {
        next(err)
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
app.post("/login", async (req, res, next) => {
    let { email, password } = req.body;
    email = email.trim().toLowerCase()
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            req.flash("error_msg", "هذا البريد الالكترونى غير مشكل لدينا برجاء انشاء حساب ")
            return res.redirect("/login")
        };
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            req.flash("error_msg", "البريد الاكترونى او كلمة السر غير صحيحه")
            return res.redirect("/login")
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.userName = user.name;
        req.session.save((err) => {
            if (err) {
                return next(err)
            }
            req.flash("success_msg", `مرحباً بك مجدداً ${user.name}! تم تسجيل الدخول بنجاح. 🎉`);
            res.redirect("/teachers")
        });
    } catch (err) {
        next(err)
    }
});

// ==================================
// 9. User Logout Action Route (GET)
// ==================================
app.get("/logout", (req, res, next) => {
    // Destroy the session in the server and clear the browser cookie
    req.session.destroy((err) => {
        if (err) {
            return next(err)
        }
        res.clearCookie("connect.sid"); // Clear the default express-session cookie ID
        res.redirect("/"); // Redirect back to the universal landing homepage
    });
});

// ====================================================================
// POST route to send the review into the reviews tabke in the database
// =====================================================================

app.post("/teachers/:id/review", requireAuth, async (req, res, next) => {
    const teacher_id = req.params.id;
    const student_id = req.session.userId;
    const { rating, review_text } = req.body;

    try {
        const checkQuery = "SELECT * FROM reviews WHERE teacher_id=$1 AND student_id = $2";
        const existingReview = await pool.query(checkQuery, [teacher_id, student_id]);
        if (existingReview.rows.length > 0) {
            req.flash("error_msg", "لا يمكن إرسال أكثر من تقييم واحد لكل مدرس.");
            return res.redirect(`/teachers/${teacher_id}`);
        }
        const queryText = "INSERT INTO reviews (teacher_id, student_id, rating , review_text) VALUES ($1, $2, $3, $4)";
        const review_entry = await pool.query(queryText, [teacher_id, student_id, rating, review_text]);
        res.redirect("/teachers");
    } catch (err) {
        next(err)
    }
});

// ====================================================================
// 11. GET Route for viewing the reviews for each teacher in a new page 
// ====================================================================

app.get("/teachers/:id", async (req, res, next) => {
    const teacher_id = req.params.id;

    try {
        const teacherQuery = "SELECT * FROM teachers WHERE id = $1";
        const reviewsQuery = `
            SELECT * FROM reviews 
            WHERE teacher_id = $1 AND status = 'approved'
        `;
        const [teacherResult, reviewsResult] = await Promise.all([
            pool.query(teacherQuery, [teacher_id]),
            pool.query(reviewsQuery, [teacher_id])]);

        if (teacherResult.rows.length === 0) {
            const err = new Error("المدرس غير موجود أو تم حذفه");
            err.status = 404;
            return next(err);
        }

        res.render("teacher-reviews", {
            teacher: teacherResult.rows[0],
            reviews: reviewsResult.rows
        });

    } catch (err) {
        next(err)
    }
});

app.use((req, res, next) => {
    const err = new Error("هذه الصفحه غير موجوده او تم حذفها");
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    if (statusCode === 500) {
        console.error(`[SERVER ERROR] [${new Date().toISOString()}]:`, err.stack);
    }
    let userMessage = " عذرا ... حدث خطا فى السيرفر و جارى العمل على اصلاحه فى اسرع وقت";
    if (statusCode === 404) {
        userMessage = err.message;
    } else if (err.code === "23505") {
        userMessage = "لقد قمت بكتابة تقييم عن هذا المدرس مسبقا"
    }

    res.status(statusCode).render("error", {
        title: statusCode === 404 ? "هذه الصفحه ليست موجوده" : "خطأ فى السيرفر",
        message: userMessage,
        status: statusCode
    });
})



// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server is running successfully on: http://localhost:${PORT}`)
});
