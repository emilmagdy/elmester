const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../db");


// ===========================================
// GET Route for renderign the register page
// ===========================================

router.get("/register", (req, res) => {
    res.render("register")
});

// ===========================================================
// POST Route for saving the registrion data into the database
// ===========================================================

router.post("/register", async (req, res, next) => {
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

router.get("/login", (req, res) => {
    res.render("login")
});

// ===========================================
// POST Route for sending the login credntials
// ===========================================
router.post("/login", async (req, res, next) => {
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
router.get("/logout", (req, res, next) => {
    // Destroy the session in the server and clear the browser cookie
    req.session.destroy((err) => {
        if (err) {
            return next(err)
        }
        res.clearCookie("connect.sid"); // Clear the default express-session cookie ID
        res.redirect("/"); // Redirect back to the universal landing homepage
    });
});

module.exports = router;