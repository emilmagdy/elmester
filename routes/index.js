const express = require('express');
const router = express.Router();
const path = require("path");

const pool = require('../db'); 

router.get('/sitemap.xml', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, subject_slug, study_type, teacher_slug FROM teachers`
        );
        
        const teachers = result.rows;
        const baseUrl = 'https://www.elmestar.com'; 

        let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        sitemapXml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        sitemapXml += `  <url>\n    <loc>${baseUrl}/</loc>\n  </url>\n`;

        sitemapXml += `  <url>\n    <loc>${baseUrl}/login</loc>\n  </url>\n`;
        sitemapXml += `  <url>\n    <loc>${baseUrl}/register</loc>\n  </url>\n`;
        sitemapXml += `  <url>\n    <loc>${baseUrl}/suggest-teacher</loc>\n  </url>\n`;

        teachers.forEach(teacher => {
            const teacherUrl = `${baseUrl}/teachers/${teacher.id}/${teacher.subject_slug}/${teacher.study_type}/${teacher.teacher_slug}`;
            sitemapXml += `  <url>\n    <loc>${teacherUrl}</loc>\n  </url>\n`;
        });

        sitemapXml += `</urlset>`;

        res.header('Content-Type', 'text/xml');
        res.send(sitemapXml);

    } catch (err) {
        console.error("Sitemap Generation Error:", err);
        res.status(500).end();
    }
});

router.get("/robots.txt", (req, res, next) => {
    res.sendFile(path.join(__dirname, "../static", "robots.txt"));
});

module.exports = router;