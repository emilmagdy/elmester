const express = require('express');
const router = express.Router();
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const path = require("path");
let sitemap; // المتغير المخزن مؤقتاً (Cache)

router.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  // إذا كانت الخريطة مخزنة مسبقاً في الذاكرة، أرسلها فوراً ووفر موارد السيرفر
  if (sitemap) {
    res.send(sitemap);
    return;
  }

  try {
    const smStream = new SitemapStream({ hostname: 'https://elmestar.com' });
    const pipeline = smStream.pipe(createGzip());

    // كتابة المسارات الأساسية
    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/teachers', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/suggest-teacher', changefreq: 'monthly', priority: 0.6 });

    // إغلاق الستريم
    smStream.end();

    // ننتظر حتى تكتمل عملية تحويل الستريم إلى Buffer مضغوط (Gzip)
    const sitemapBuffer = await streamToPromise(pipeline);
    
    // حفظ الـ Buffer في الذاكرة للطلبات القادمة
    sitemap = sitemapBuffer;

    // إرسال البيانات للمستخدم
    res.send(sitemapBuffer);

  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

// مسار الـ robots.txt الذي أضفته بشكل صحيح وممتاز
router.get("/robots.txt", (req, res, next) => {
  res.sendFile(path.join(__dirname, "../static", "robots.txt"));
});

module.exports = router;