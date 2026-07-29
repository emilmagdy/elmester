const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const pool = require("../db");
const passport = require("../utils/passport.js"); // 1. تصحيح الـ Import

// ===========================================
// GET Route for rendering the register page
// ===========================================
router.get("/register", (req, res) => {
    res.render("register");
});

// ===========================================================
// POST Route for saving the registration data into the database
// ===========================================================
router.post("/register", async (req, res, next) => {
    let { name, email, password, grade } = req.body;
    try {
        email = email.trim().toLowerCase();
        const exits = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (exits.rows.length > 0) {
            req.flash("error_msg", "هذا البريد الالكترونى مسجل من قبل برجاء تسجيل الدخول");
            return res.redirect("/login");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
      
        await pool.query(
            'INSERT INTO users (name, email, password_hash, grade) VALUES ($1, $2, $3, $4)',
            [name, email, hashedPassword, grade]
        );
        
        req.flash("success_msg", "تم انشاء الحساب بنجاح برجاء تسجيل الدخول");
        return res.redirect('/login');
    } catch (err) {
        next(err);
    }
});

// ================================
// Google OAuth Routes
// ================================
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureFlash: 'فشل تسجيل الدخول عبر جوجل'
  }),
  (req, res) => {
    req.session.userId = req.user.id;
    req.session.userName = req.user.name;
    req.session.userRole = req.user.role;

    req.flash("success_msg", `مرحباً بك ${req.user.name}! 🎉`);
    res.redirect('/teachers');
  }
);

// ================================
// GET Route for email verification
// ================================
router.get('/verification-email', async (req, res, next) => {
    const token = req.query.token;
    const currentTime = new Date();
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE verification_token=$1', [token]);
        if (userResult.rows.length > 0 && userResult.rows[0].token_expires > currentTime) {
            const user = userResult.rows[0];
            await pool.query('UPDATE users SET is_verified=TRUE, verification_token=NULL, token_expires=NULL WHERE id = $1', [user.id]);
            req.flash("success_msg", "تم تفعيل حسابك بنجاح");
            
            req.session.userId = user.id;
            req.session.userName = user.name;
            req.session.userRole = user.role;

            return res.redirect('/teachers');
        } else {
            req.flash("error_msg", "رابط التفعيل غير صالح او انتهت صلاحيته");
            return res.redirect("/login");
        }
    } catch (err) {
        return next(err);
    }
});

// ======================================
// GET Route for rendering the login page
// ====================================== 
router.get("/login", (req, res) => {
    res.render("login");
});

// ===========================================
// POST Route for sending the login credentials
// ===========================================
router.post("/login", async (req, res, next) => {
    let { email, password } = req.body;
    email = email.trim().toLowerCase();
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            req.flash("error_msg", "هذا البريد الالكترونى غير مسجل لدينا برجاء انشاء حساب");
            return res.redirect("/login");
        }
        const user = result.rows[0];

        if (!user.password_hash) {
            req.flash("error_msg", "هذا الحساب مسجل عبر Google. برجاء الضغط على زر تسجيل الدخول بواسطة Google.");
            return res.redirect("/login");
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            req.flash("error_msg", "البريد الاكترونى او كلمة السر غير صحيحه");
            return res.redirect("/login");
        }

        if (!user.is_verified) {
            req.flash("error_msg", "لم يتم تفعيل الحساب برجاء التوجه الى البريد الالكترونى والضغط على رابط التفعيل");
            return res.redirect("/login");
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;
        req.session.userName = user.name;

        req.session.save((err) => {
            if (err) return next(err);
            req.flash("success_msg", `مرحباً بك مجدداً ${user.name}! تم تسجيل الدخول بنجاح. 🎉`);
            res.redirect("/teachers");
        });
    } catch (err) {
        next(err);
    }
});

// ==================================
// User Logout Action Route (GET)
// ==================================
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie("connect.sid");
            res.redirect("/");
        });
    });
});

module.exports = router;