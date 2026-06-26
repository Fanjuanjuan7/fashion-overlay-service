const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { chromium } = require('playwright');

const app = express();
const PORT = Number(process.env.PORT || 7001);
const MAX_IMAGE_SIZE = 30 * 1024 * 1024;
const TARGET_W = 1080;
const TARGET_H = 1920;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_SIZE } });
let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=medium'],
    });
  }
  return browserPromise;
}

const STYLE_ALIASES = {
  thai_fashion_luxury: 'thai_fashion_luxury',
  malay_modest_luxury: 'malay_modest_luxury',
  sweet_daily_girl: 'sweet_daily_girl',
  magazine_editorial: 'magazine_editorial',
  clean_tips_card: 'clean_tips_card',
  '泰国高级轻奢风': 'thai_fashion_luxury',
  '泰国轻奢风': 'thai_fashion_luxury',
  '泰国通勤高级风': 'thai_fashion_luxury',
  '马来通勤轻熟风': 'malay_modest_luxury',
  '马来端庄轻熟风': 'malay_modest_luxury',
  '马来西亚端庄轻熟风': 'malay_modest_luxury',
  '甜美日常少女风': 'sweet_daily_girl',
  '少女甜美风': 'sweet_daily_girl',
  '时尚杂志封面风': 'magazine_editorial',
  '杂志封面风': 'magazine_editorial',
  '穿搭技巧卡片风': 'clean_tips_card',
  '技巧卡片风': 'clean_tips_card',
};

const TEMPLATE_ALIASES = {
  cover_hero: 'cover_hero',
  bottom_caption: 'bottom_caption',
  side_caption: 'side_caption',
  detail_card: 'detail_card',
  tips_sticker: 'tips_sticker',
  formula_layout: 'formula_layout',
  '封面大标题': 'cover_hero',
  '封面海报': 'cover_hero',
  '底部字幕卡片': 'bottom_caption',
  '底部文案': 'bottom_caption',
  '侧边字幕卡片': 'side_caption',
  '侧边文案': 'side_caption',
  '细节小卡片': 'detail_card',
  '细节卡片': 'detail_card',
  '技巧贴纸卡片': 'tips_sticker',
  '技巧贴纸': 'tips_sticker',
  '搭配公式页': 'formula_layout',
  '公式页': 'formula_layout',
};

function normalizeStylePack(input) {
  const raw = String(input || '').trim();
  return STYLE_ALIASES[raw] || STYLE_ALIASES[raw.toLowerCase()] || 'thai_fashion_luxury';
}
function normalizeTemplate(input) {
  const raw = String(input || '').trim();
  return TEMPLATE_ALIASES[raw] || TEMPLATE_ALIASES[raw.toLowerCase()] || 'bottom_caption';
}
function escapeHtml(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function styleTokens(stylePack) {
  const fontFamily = `"Noto Sans Thai", "Noto Sans CJK SC", "Noto Sans CJK TC", "Noto Sans", "Noto Color Emoji", Arial, sans-serif`;
  const styles = {
    thai_fashion_luxury: {
      name: 'thai_fashion_luxury', fontFamily,
      cardBg: 'rgba(16, 15, 14, 0.56)', cardBgStrong: 'rgba(10, 9, 8, 0.68)', cardBorder: 'rgba(255,255,255,0.22)',
      title: '#fffaf1', text: '#ffffff', muted: 'rgba(255,255,255,0.78)', accent: '#d9bc82', shadow: 'rgba(0,0,0,0.38)',
      pageFade: 'linear-gradient(to top, rgba(0,0,0,.55), rgba(0,0,0,.22), rgba(0,0,0,0))', radius: 44,
    },
    malay_modest_luxury: {
      name: 'malay_modest_luxury', fontFamily,
      cardBg: 'rgba(248, 241, 229, 0.78)', cardBgStrong: 'rgba(250, 245, 236, 0.88)', cardBorder: 'rgba(120, 98, 74, 0.24)',
      title: '#3f342d', text: '#4a3e36', muted: 'rgba(74,62,54,.74)', accent: '#b99768', shadow: 'rgba(69,52,35,0.20)',
      pageFade: 'linear-gradient(to top, rgba(61,45,33,.26), rgba(255,255,255,.03), rgba(255,255,255,0))', radius: 42,
    },
    sweet_daily_girl: {
      name: 'sweet_daily_girl', fontFamily,
      cardBg: 'rgba(255, 246, 241, 0.78)', cardBgStrong: 'rgba(255, 248, 244, 0.90)', cardBorder: 'rgba(236, 170, 185, 0.34)',
      title: '#8e5b5e', text: '#8a6060', muted: 'rgba(138,96,96,.72)', accent: '#e8a9b7', shadow: 'rgba(154, 93, 105, 0.20)',
      pageFade: 'linear-gradient(to top, rgba(243,188,200,.22), rgba(255,255,255,.02), rgba(255,255,255,0))', radius: 50,
    },
    magazine_editorial: {
      name: 'magazine_editorial', fontFamily,
      cardBg: 'rgba(8, 8, 8, 0.48)', cardBgStrong: 'rgba(6, 6, 6, 0.60)', cardBorder: 'rgba(255,255,255,0.20)',
      title: '#fffaf2', text: '#ffffff', muted: 'rgba(255,255,255,.78)', accent: '#f0d28a', shadow: 'rgba(0,0,0,.38)',
      pageFade: 'linear-gradient(to top, rgba(0,0,0,.62), rgba(0,0,0,.20), rgba(0,0,0,0))', radius: 26,
    },
    clean_tips_card: {
      name: 'clean_tips_card', fontFamily,
      cardBg: 'rgba(250, 247, 239, 0.82)', cardBgStrong: 'rgba(252, 249, 242, 0.92)', cardBorder: 'rgba(96, 78, 60, 0.22)',
      title: '#40352e', text: '#55483f', muted: 'rgba(85,72,63,.72)', accent: '#b79968', shadow: 'rgba(47, 38, 28, 0.18)',
      pageFade: 'linear-gradient(to top, rgba(58,45,32,.18), rgba(255,255,255,.02), rgba(255,255,255,0))', radius: 38,
    },
  };
  return styles[stylePack] || styles.thai_fashion_luxury;
}

function buildHtml({ imageBase64, title, text, stylePack, template, page }) {
  const s = styleTokens(stylePack);
  const safeTitle = escapeHtml(title);
  const safeText = escapeHtml(text);
  const showTitle = safeTitle.length > 0;
  const pageNum = Number(page || 1);
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
*{box-sizing:border-box}html,body{margin:0;width:${TARGET_W}px;height:${TARGET_H}px;overflow:hidden;font-family:${s.fontFamily}}body{position:relative;background:#eee}.bg{position:absolute;inset:0;width:${TARGET_W}px;height:${TARGET_H}px;object-fit:cover}.fade-bottom{position:absolute;left:0;right:0;bottom:0;height:720px;background:${s.pageFade};pointer-events:none}.safe-top-right{position:absolute;top:0;right:0;width:260px;height:190px;pointer-events:none}.card{position:absolute;border:1.6px solid ${s.cardBorder};background:${s.cardBg};color:${s.text};border-radius:${s.radius}px;box-shadow:0 22px 70px ${s.shadow};backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}.title{color:${s.title};font-weight:760;letter-spacing:-.015em;line-height:1.13;text-wrap:balance;white-space:pre-line;text-shadow:0 4px 28px rgba(0,0,0,.28)}.text{color:${s.text};font-weight:500;letter-spacing:.01em;line-height:1.42;white-space:pre-line;text-wrap:balance}.accent-line{height:2px;background:linear-gradient(90deg,${s.accent},rgba(255,255,255,0));opacity:.78}.thin-line{height:1.5px;background:${s.accent};opacity:.42}.tpl-cover_hero .fade-bottom{height:860px}.tpl-cover_hero .hero{left:68px;bottom:238px;width:870px;padding:54px 58px 48px;border-radius:${s.name==='magazine_editorial'?18:s.radius}px;background:${s.name==='magazine_editorial'?'linear-gradient(110deg,rgba(0,0,0,.62),rgba(0,0,0,.22),rgba(0,0,0,0))':s.cardBgStrong};border-color:${s.cardBorder}}.tpl-cover_hero .hero .title{font-size:${pageNum===1?76:68}px;max-width:760px}.tpl-cover_hero .hero .text{font-size:39px;margin-top:30px;max-width:780px}.tpl-cover_hero .cover-kicker{position:absolute;left:80px;top:104px;color:${s.name==='thai_fashion_luxury'||s.name==='magazine_editorial'?'rgba(255,255,255,.82)':s.muted};font-size:28px;letter-spacing:.24em;font-weight:650}.tpl-bottom_caption .bottom{left:72px;right:72px;bottom:170px;padding:43px 54px 42px;text-align:center;background:${s.cardBgStrong}}.tpl-bottom_caption .bottom .title{font-size:44px;margin-bottom:14px}.tpl-bottom_caption .bottom .text{font-size:42px}.tpl-side_caption .side{right:74px;top:540px;width:405px;min-height:520px;padding:48px 44px;background:${s.cardBgStrong}}.tpl-side_caption .side .title{font-size:45px;margin-bottom:28px}.tpl-side_caption .side .text{font-size:37px;line-height:1.48}.tpl-detail_card .detail{right:80px;bottom:430px;width:450px;padding:42px 40px;background:${s.cardBgStrong};border-radius:36px}.tpl-detail_card .detail .title{font-size:43px;margin-bottom:26px}.tpl-detail_card .detail .text{font-size:34px;line-height:1.48}.tpl-tips_sticker .sticker-title{left:70px;top:155px;padding:24px 40px;max-width:620px;background:${s.cardBgStrong};border-radius:34px;transform:rotate(-1.2deg)}.tpl-tips_sticker .sticker-title .title{font-size:46px}.tpl-tips_sticker .tip{right:78px;bottom:445px;width:470px;padding:44px 42px;background:${s.cardBgStrong};border-radius:36px}.tpl-tips_sticker .tip .text{font-size:36px;line-height:1.50}.tpl-formula_layout .formula{left:64px;top:380px;width:520px;min-height:900px;padding:58px 54px 50px;background:${s.name==='thai_fashion_luxury'||s.name==='magazine_editorial'?'rgba(10,10,10,.42)':s.cardBgStrong};border-radius:48px}.tpl-formula_layout .formula .title{font-size:52px;margin-bottom:38px}.tpl-formula_layout .formula .text{font-size:45px;line-height:1.55;text-align:center}.brand-foot{position:absolute;left:70px;bottom:70px;font-size:24px;letter-spacing:.18em;color:${s.name==='thai_fashion_luxury'||s.name==='magazine_editorial'?'rgba(255,255,255,.74)':s.muted}}
</style></head><body class="tpl-${template} style-${stylePack}"><img class="bg" src="data:image/jpeg;base64,${imageBase64}"/><div class="fade-bottom"></div><div class="safe-top-right"></div>
${template==='cover_hero'?`<div class="cover-kicker">DAILY OUTFIT</div><div class="card hero"><div class="title">${showTitle?safeTitle:safeText}</div>${showTitle&&safeText?`<div class="accent-line" style="width:360px;margin:28px 0 0;"></div><div class="text">${safeText}</div>`:''}</div><div class="brand-foot">STYLE IS AN ATTITUDE</div>`:''}
${template==='bottom_caption'?`<div class="card bottom">${showTitle?`<div class="title">${safeTitle}</div>`:''}<div class="text">${safeText}</div><div class="thin-line" style="width:190px;margin:30px auto 0;"></div></div>`:''}
${template==='side_caption'?`<div class="card side">${showTitle?`<div class="title">${safeTitle}</div><div class="thin-line" style="width:220px;margin:0 0 30px;"></div>`:''}<div class="text">${safeText}</div></div>`:''}
${template==='detail_card'?`<div class="card detail">${showTitle?`<div class="title">${safeTitle}</div><div class="thin-line" style="width:240px;margin:0 0 26px;"></div>`:''}<div class="text">${safeText}</div></div>`:''}
${template==='tips_sticker'?`${showTitle?`<div class="card sticker-title"><div class="title">${safeTitle}</div></div>`:''}<div class="card tip"><div class="text">${safeText}</div></div>`:''}
${template==='formula_layout'?`<div class="card formula">${showTitle?`<div class="title">${safeTitle}</div>`:''}<div class="thin-line" style="width:300px;margin:0 auto 36px;"></div><div class="text">${safeText}</div></div>`:''}
</body></html>`;
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'fashion-overlay-service', version: '2.0.0', supported_languages: ['zh-CN','en','th','ms','emoji'], supported_style_packs: ['thai_fashion_luxury','malay_modest_luxury','sweet_daily_girl','magazine_editorial','clean_tips_card'], supported_templates: ['cover_hero','bottom_caption','side_caption','detail_card','tips_sticker','formula_layout'] });
});

app.post('/overlay', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ ok: false, error: 'Missing multipart field: image' });
    const title = String(req.body.title || '').trim();
    const text = String(req.body.text || '').trim();
    const page = Number(req.body.page || 1);
    const stylePack = normalizeStylePack(req.body.style_pack);
    const template = normalizeTemplate(req.body.template);
    const resized = await sharp(req.file.buffer).rotate().resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'attention' }).jpeg({ quality: 94, mozjpeg: true }).toBuffer();
    const html = buildHtml({ imageBase64: resized.toString('base64'), title, text, page, stylePack, template });
    const browser = await getBrowser();
    const pageObj = await browser.newPage({ viewport: { width: TARGET_W, height: TARGET_H }, deviceScaleFactor: 1 });
    await pageObj.setContent(html, { waitUntil: 'networkidle' });
    await pageObj.evaluateHandle('document.fonts.ready');
    const pngBuffer = await pageObj.screenshot({ type: 'png', fullPage: false, clip: { x: 0, y: 0, width: TARGET_W, height: TARGET_H } });
    await pageObj.close();
    const jpg = await sharp(pngBuffer).resize(TARGET_W, TARGET_H, { fit: 'cover' }).jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(jpg);
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ ok: false, error: 'Image is too large. Max size is 30MB.' });
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
});

process.on('SIGTERM', async () => {
  try { if (browserPromise) { const browser = await browserPromise; await browser.close(); } } finally { process.exit(0); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`fashion-overlay-service v2 listening on 0.0.0.0:${PORT}`));
