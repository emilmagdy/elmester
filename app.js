require("dotenv").config()
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const session = require("express-session")
const express = require('express');
const app = express();
const flash = require("connect-flash")
const PORT = process.env.PORT || 3000

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student")

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Middleware to parse the URL Encoded data embedded in the form body
app.use(express.urlencoded({ extended: true }));

// Configure session middleware to track logged-in users
app.use(session({
    secret: process.env.SESSION_SECRET, // Secret key to sign the session ID cookie
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true, // يحمي الكوكي من السرقة عبر حواسب المستخدمين (XSS)
        secure: process.env.NODE_ENV === 'production' // الـ كوكي تعمل فقط عبر HTTPS في السيرفر الحي
    }}));

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

app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", studentRoutes);

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
