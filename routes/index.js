const express = require('express');
const router = express.Router();
const path = require("path");

// استيراد الـ pool الخاص بقاعدة البيانات (تأكد من كتابة المسار الصحيح لملف الـ db الخاص بك)
const pool = require('../db'); 

// مسار الـ sitemap.xml الديناميكي
router.get('/sitemap.xml', async (req, res) => {
    try {
        // 1. جلب البيانات المطلوبة لبناء الروابط لكل المدرسين
        const result = await pool.query(
            `SELECT id, subject_slug, study_type, teacher_slug FROM teachers`
        );
        
        const teachers = result.rows;
        const baseUrl = 'https://www.elmestar.com'; 

        // 2. بناء هيكل الـ XML الخاص بالخريطة
        let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // إضافة الرابط الرئيسي للموقع (الصفحة الرئيسية)
        sitemapXml += `  <url>\n    <loc>${baseUrl}/</loc>\n  </url>\n`;

        // 🌟 إضافة الصفحات الثابتة الأساسية (Login, Register, Suggest Teacher)
        sitemapXml += `  <url>\n    <loc>${baseUrl}/login</loc>\n  </url>\n`;
        sitemapXml += `  <url>\n    <loc>${baseUrl}/register</loc>\n  </url>\n`;
        sitemapXml += `  <url>\n    <loc>${baseUrl}/suggest-teacher</loc>\n  </url>\n`;

        // 3. Loop لتوليد رابط كل مدرس ديناميكياً بناءً على الهيكل الجديد
        teachers.forEach(teacher => {
            const teacherUrl = `${baseUrl}/teachers/${teacher.id}/${teacher.subject_slug}/${teacher.study_type}/${teacher.teacher_slug}`;
            sitemapXml += `  <url>\n    <loc>${teacherUrl}</loc>\n  </url>\n`;
        });

        sitemapXml += `</urlset>`;

        // 4. ضبط الـ Header ليفهم جوجل أن هذا ملف XML وليس HTML
        res.header('Content-Type', 'text/xml');
        res.send(sitemapXml);

    } catch (err) {
        console.error("Sitemap Generation Error:", err);
        res.status(500).end();
    }
});

// مسار الـ robots.txt
router.get("/robots.txt", (req, res, next) => {
    res.sendFile(path.join(__dirname, "../static", "robots.txt"));
});

module.exports = router;