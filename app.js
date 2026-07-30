require("dotenv").config()
const path = require('path')
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const session = require("express-session")
const express = require('express');
const app = express();
const flash = require("connect-flash")
const PORT = process.env.PORT || 3000
const isProduction = process.env.NODE_ENV === "production"
const passaport = require('./utils/passport')

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student")
const indexRoutes = require("./routes/index")


// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set("trust proxy", 1);
app.use('/static', express.static('static'));
app.use(express.static(path.join(__dirname, 'static')));

// Middleware to parse the URL Encoded data embedded in the form body
app.use(express.urlencoded({ extended: true }));

// Configure session middleware to track logged-in users
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true, 
        secure: isProduction, 
        sameSite: "lax"
    }
}));

app.use(passaport.initialize())
app.use(passaport.session())

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    next()
});
// Middleware to [ass session data to all ejs views
app.use((req, res, next) => {
    res.locals.userSession = {
        userId: req.session.userId || (req.user ? req.user.id : null),
        userName: req.session.userName || (req.user ? req.user.name : null),
        userRole: req.session.userRole || (req.user ? req.user.role : null)
    };
    next();
});

app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", studentRoutes);
app.use("/", indexRoutes);


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
