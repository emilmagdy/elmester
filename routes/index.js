const express = require('express');
const router = express.Router();
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
let sitemap;

router.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.header('Content-Encoding', 'gzip');

  if (sitemap) {
    res.send(sitemap);
    return;
  }

  try {
    const smStream = new SitemapStream({ hostname: 'https://elmestar.com' });
    const pipeline = smStream.pipe(createGzip());

    smStream.write({ url: '/', changefreq: 'daily', priority: 1.0 });
    smStream.write({ url: '/teachers', changefreq: 'daily', priority: 0.8 });
    smStream.write({ url: '/suggest-teacher', changefreq: 'monthly', priority: 0.6 });

    smStream.end();
    streamToPromise(pipeline).then(sm => sitemap = sm);
    pipeline.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
});

module.exports = router;