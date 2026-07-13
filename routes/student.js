const express = require("express");
const router = express.Router();
const pool = require("../db");
const requireAuth = require("../middlewares/authMiddleware");

// ===================
// 1. Home Page Route
// ===================
router.get('/', (req, res) => {
    // Renders index.ejs which contains navigation buttons and platform features
    res.render('index', { currentPage: "index" });
});

// ==========================================
// 2. Teachers List Route
// ==========================================
router.get('/teachers', async (req, res, next) => {
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
            subjects: subjectList,
            currentPage: "teachers"
        });
    } catch (err) {
        next(err)
    }
});

// ====================================================================
// POST route to send the review into the reviews tabke in the database
// =====================================================================

router.post("/teachers/:id/review", requireAuth, async (req, res, next) => {
    const teacher_id = req.params.id;
    const student_id = req.session.userId;
    const { rating, review_text } = req.body;

    try {
        const checkQuery = "SELECT * FROM reviews WHERE teacher_id=$1 AND student_id = $2";
        const existingReview = await pool.query(checkQuery, [teacher_id, student_id]);
        if (existingReview.rows.length > 0) {
            req.flash("error_msg", "لا يمكن إرسال أكثر من تقييم واحد لكل مدرس.");
            return res.redirect(`/teachers`);
        }
        const queryText = "INSERT INTO reviews (teacher_id, student_id, rating , review_text) VALUES ($1, $2, $3, $4)";
        const review_entry = await pool.query(queryText, [teacher_id, student_id, rating, review_text]);
        req.flash("success_msg", "🙌 رائع! تم حفظ تقييمك بنجاح. رأيك يهمنا وبيساعد زمايلك يختاروا المدرس الصح، هيتم مراجعته ونشره في أسرع وقت.");
        setTimeout(() => {
            if (!res.headersSent) {
                return res.redirect("/teachers");
            }
        }, 50);

    } catch (err) {
        next(err)
    }
});

// ====================================================================
// 11. GET Route for viewing the reviews for each teacher in a new page 
// ====================================================================

router.get("/teachers/:id", async (req, res, next) => {
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
            reviews: reviewsResult.rows,
            currentPage: "teachers"
        });
    } catch (err) {
        next(err)
    }
});

// GET Route for rendering the teaccher-suggestion form

router.get("/suggest-teacher",  (req, res) => {
    res.render("suggest-teacher", { currentPage: "suggest-teacher" })
});

// POST Route for sending the teaccher-suggestion to the teacher suggestion table in the database

router.post("/suggest-teacher",  async (req, res, next) => {
    const { name, subject, city } = req.body;
    try {
        queryText = `
        INSERT INTO teacher_suggestions (name, subject, city) 
        VALUES ($1, $2, $3)
        `;
        queryParams = [name, subject, city];

        await pool.query(queryText, queryParams);
        req.flash("success-msg", "تم استلام الاقتراح بنجاح ")
        res.redirect("/teachers")
    } catch (err) {
        return next(err)
    };
});

module.exports = router;
