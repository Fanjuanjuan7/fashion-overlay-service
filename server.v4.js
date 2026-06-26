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
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function styleTokens(stylePack) {
  const titleFont = `"Kanit", "Noto Sans Thai", "Noto Sans CJK SC", "Noto Sans", "Noto Color Emoji", Arial, sans-serif`;
  const bodyFont = `"Noto Sans Thai", "Noto Sans CJK SC", "Noto Sans", "Noto Color Emoji", Arial, sans-serif`;
  const latinFont = `"Plus Jakarta Sans", "Inter", "Noto Sans", "Noto Sans Thai", "Noto Sans CJK SC", "Noto Color Emoji", Arial, sans-serif`;
  const styles = {
    thai_fashion_luxury: {
      titleFont, bodyFont, latinFont,
      bg: 'rgba(255, 246, 239, .52)', bg2: 'rgba(255, 251, 247, .63)',
      ink: '#86515b', ink2: '#76535a', muted: 'rgba(124,82,86,.68)',
      accent: '#c79292', accent2: '#f2d7cf', line: 'rgba(199,146,146,.45)',
      border: 'rgba(255,255,255,.55)', shine: 'rgba(255,255,255,.32)',
      shadow: 'rgba(76, 43, 36, .18)', strongShadow: 'rgba(65, 36, 32, .24)',
      darkFade: 'linear-gradient(to top, rgba(71,45,39,.22), rgba(71,45,39,.06), rgba(71,45,39,0))',
    },
    malay_modest_luxury: {
      titleFont, bodyFont, latinFont,
      bg: 'rgba(255, 249, 237, .54)', bg2: 'rgba(255, 253, 246, .66)',
      ink: '#71533e', ink2: '#665142', muted: 'rgba(105,80,62,.70)',
      accent: '#b89467', accent2: '#efdfc2', line: 'rgba(184,148,103,.42)',
      border: 'rgba(255,255,255,.50)', shine: 'rgba(255,255,255,.30)',
      shadow: 'rgba(69, 49, 32, .17)', strongShadow: 'rgba(57, 40, 29, .22)',
      darkFade: 'linear-gradient(to top, rgba(65,48,35,.20), rgba(65,48,35,.05), rgba(65,48,35,0))',
    },
    sweet_daily_girl: {
      titleFont, bodyFont, latinFont,
      bg: 'rgba(255, 246, 247, .54)', bg2: 'rgba(255, 252, 251, .68)',
      ink: '#985f70', ink2: '#8d6670', muted: 'rgba(145,94,105,.70)',
      accent: '#e7a9bd', accent2: '#f8dce5', line: 'rgba(231,169,189,.44)',
      border: 'rgba(255,255,255,.58)', shine: 'rgba(255,255,255,.34)',
      shadow: 'rgba(134, 74, 88, .16)', strongShadow: 'rgba(123, 67, 81, .22)',
      darkFade: 'linear-gradient(to top, rgba(229,174,188,.20), rgba(229,174,188,.05), rgba(229,174,188,0))',
    },
    magazine_editorial: {
      titleFont, bodyFont, latinFont,
      bg: 'rgba(26, 20, 17, .34)', bg2: 'rgba(18, 14, 12, .42)',
      ink: '#fff7ef', ink2: '#f9eee7', muted: 'rgba(255,245,238,.72)',
      accent: '#e9c37b', accent2: 'rgba(255,255,255,.15)', line: 'rgba(233,195,123,.48)',
      border: 'rgba(255,255,255,.24)', shine: 'rgba(255,255,255,.12)',
      shadow: 'rgba(0,0,0,.34)', strongShadow: 'rgba(0,0,0,.44)',
      darkFade: 'linear-gradient(to top, rgba(0,0,0,.48), rgba(0,0,0,.14), rgba(0,0,0,0))',
    },
    clean_tips_card: {
      titleFont, bodyFont, latinFont,
      bg: 'rgba(255, 250, 243, .55)', bg2: 'rgba(255, 253, 248, .68)',
      ink: '#6f5143', ink2: '#68554c', muted: 'rgba(105,83,73,.70)',
      accent: '#b99868', accent2: '#ecdec7', line: 'rgba(185,152,104,.42)',
      border: 'rgba(255,255,255,.50)', shine: 'rgba(255,255,255,.30)',
      shadow: 'rgba(55, 40, 31, .15)', strongShadow: 'rgba(47, 35, 28, .22)',
      darkFade: 'linear-gradient(to top, rgba(58,45,34,.16), rgba(58,45,34,.04), rgba(58,45,34,0))',
    },
  };
  return styles[stylePack] || styles.thai_fashion_luxury;
}

function defaultBadge(template, page) {
  if (template === 'cover_hero') return 'PETITE HACK';
  if (template === 'bottom_caption') return page === 3 ? 'DAILY LOOK' : 'KEY TIP';
  if (template === 'detail_card') return 'DETAIL';
  if (template === 'tips_sticker') return '⚠️ หลีกเลี่ยง';
  if (template === 'formula_layout') return 'FORMULA';
  return 'STYLE NOTE';
}

function buildHtml({ imageBase64, badge, title, text, stylePack, template, page }) {
  const s = styleTokens(stylePack);
  const safeBadge = escapeHtml(badge || defaultBadge(template, Number(page || 1)));
  const safeTitle = escapeHtml(title);
  const safeText = escapeHtml(text);
  const showTitle = safeTitle.length > 0;
  const showText = safeText.length > 0;
  const dark = stylePack === 'magazine_editorial';

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
*{box-sizing:border-box}html,body{margin:0;width:${TARGET_W}px;height:${TARGET_H}px;overflow:hidden}body{position:relative;background:#eee;font-family:${s.bodyFont};-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}.bg{position:absolute;inset:0;width:${TARGET_W}px;height:${TARGET_H}px;object-fit:cover}.fade-bottom{position:absolute;left:0;right:0;bottom:0;height:610px;background:${s.darkFade};pointer-events:none}.safe-top-right{position:absolute;top:0;right:0;width:330px;height:220px;pointer-events:none}.grain{position:absolute;inset:0;opacity:.045;background-image:radial-gradient(circle at 20% 20%,#fff 0 1px,transparent 1.4px);background-size:5px 5px;mix-blend-mode:soft-light;pointer-events:none}.glass{position:absolute;color:${s.ink2};border:1px solid ${s.border};background:linear-gradient(135deg,${s.bg2},${s.bg});box-shadow:0 22px 58px ${s.shadow}, inset 0 1px 0 rgba(255,255,255,.38);backdrop-filter:blur(22px) saturate(1.18);-webkit-backdrop-filter:blur(22px) saturate(1.18);overflow:hidden}.glass:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 0%,${s.shine},transparent 42%),linear-gradient(135deg,rgba(255,255,255,.30),rgba(255,255,255,.04));pointer-events:none}.inner{position:relative;z-index:2}.badge{display:inline-flex;align-items:center;gap:8px;font-family:${s.latinFont};font-size:20px;line-height:1;font-weight:850;letter-spacing:.105em;text-transform:uppercase;color:${s.ink};padding:12px 18px 11px;border-radius:999px;background:linear-gradient(135deg,rgba(255,255,255,.62),rgba(255,255,255,.25));border:1px solid rgba(255,255,255,.56);box-shadow:0 9px 22px rgba(73,44,37,.08), inset 0 1px 0 rgba(255,255,255,.60);text-shadow:0 1px 0 rgba(255,255,255,.35)}.badge.warning{color:#a35454;background:linear-gradient(135deg,rgba(255,251,249,.72),rgba(255,238,232,.46))}.title{font-family:${s.titleFont};color:${s.ink};font-weight:900;letter-spacing:-.028em;line-height:1.10;white-space:pre-line;text-wrap:balance;text-shadow:0 1px 0 rgba(255,255,255,.54),0 9px 20px ${s.shadow},0 20px 48px rgba(80,45,35,.08);-webkit-text-stroke:.35px rgba(255,255,255,.25)}.text{font-family:${s.bodyFont};color:${s.ink2};font-weight:650;letter-spacing:.003em;line-height:1.42;white-space:pre-line;text-wrap:balance;text-shadow:0 1px 0 rgba(255,255,255,.40),0 9px 22px rgba(80,45,35,.08)}.rule{height:1px;background:linear-gradient(90deg,${s.line},rgba(255,255,255,0));opacity:.9}.rule-center{height:1px;background:linear-gradient(90deg,rgba(255,255,255,0),${s.line},rgba(255,255,255,0));opacity:.9}.micro{position:absolute;font-family:${s.latinFont};font-size:22px;font-weight:800;letter-spacing:.26em;color:${s.muted};text-transform:uppercase}.corner-dot{width:8px;height:8px;border-radius:99px;background:${s.accent};box-shadow:0 0 0 7px rgba(255,255,255,.35)}
/* cover */.tpl-cover_hero .fade-bottom{height:770px}.tpl-cover_hero .micro.top{left:80px;top:115px}.tpl-cover_hero .hero{left:66px;bottom:232px;width:840px;padding:42px 50px 43px;border-radius:44px}.tpl-cover_hero .hero .badge{margin-bottom:22px}.tpl-cover_hero .hero .title{font-size:80px;max-width:720px}.tpl-cover_hero .hero .rule{width:270px;margin:25px 0 24px}.tpl-cover_hero .hero .text{font-size:35px;line-height:1.42;max-width:720px}.tpl-cover_hero .micro.foot{left:72px;bottom:72px;font-size:20px;letter-spacing:.22em}
/* bottom */.tpl-bottom_caption .bottom{left:82px;right:82px;bottom:165px;padding:34px 44px 36px;border-radius:38px;text-align:left}.tpl-bottom_caption .bottom .row{display:flex;align-items:center;gap:15px;margin-bottom:18px}.tpl-bottom_caption .bottom .title{font-size:42px}.tpl-bottom_caption .bottom .rule{width:250px;margin:0 0 18px}.tpl-bottom_caption .bottom .text{font-size:34px;line-height:1.42;max-width:810px}.tpl-bottom_caption .bottom.center .text{text-align:left}
/* side */.tpl-side_caption .side{right:64px;top:545px;width:410px;padding:36px 35px;border-radius:34px}.tpl-side_caption .side .badge{margin-bottom:18px}.tpl-side_caption .side .title{font-size:40px}.tpl-side_caption .side .rule{width:200px;margin:18px 0}.tpl-side_caption .side .text{font-size:32px;line-height:1.48}
/* detail */.tpl-detail_card .detail{right:70px;bottom:410px;width:420px;padding:33px 34px;border-radius:32px}.tpl-detail_card .detail .badge{font-size:18px;margin-bottom:18px}.tpl-detail_card .detail .title{font-size:38px}.tpl-detail_card .detail .rule{width:210px;margin:18px 0}.tpl-detail_card .detail .text{font-size:31px;line-height:1.48}
/* tips sticker */.tpl-tips_sticker .warn{left:72px;top:145px;max-width:550px;padding:18px 28px;border-radius:28px;transform:rotate(-1.2deg)}.tpl-tips_sticker .warn .badge{font-size:28px;letter-spacing:.02em;text-transform:none;background:transparent;border:none;box-shadow:none;padding:0}.tpl-tips_sticker .tip{right:70px;bottom:420px;width:450px;padding:34px 36px;border-radius:32px}.tpl-tips_sticker .tip .text{font-size:33px;line-height:1.48;font-weight:730}.tpl-tips_sticker .tip .text::first-letter{color:#c95555}
/* formula */.tpl-formula_layout .formula{right:64px;top:318px;width:430px;padding:34px 36px 36px;border-radius:34px}.tpl-formula_layout .formula .badge{font-size:18px;margin-bottom:18px}.tpl-formula_layout .formula .title{font-size:38px}.tpl-formula_layout .formula .rule{width:220px;margin:18px 0 22px}.tpl-formula_layout .formula .text{font-size:33px;line-height:1.52;font-weight:760;text-align:left}.tpl-formula_layout .formula .equal{display:block;margin-top:10px;color:${s.ink};font-size:38px;font-weight:900}
</style></head><body class="tpl-${template} style-${stylePack}"><img class="bg" src="data:image/jpeg;base64,${imageBase64}"/><div class="fade-bottom"></div><div class="grain"></div><div class="safe-top-right"></div>
${template==='cover_hero'?`<div class="micro top">DAILY OUTFIT</div><div class="glass hero"><div class="inner"><div class="badge">${safeBadge}</div><div class="title">${showTitle?safeTitle:safeText}</div>${showTitle&&showText?`<div class="rule"></div><div class="text">${safeText}</div>`:''}</div></div><div class="micro foot">STYLE NOTES</div>`:''}
${template==='bottom_caption'?`<div class="glass bottom"><div class="inner"><div class="row"><div class="badge">${safeBadge}</div><div class="corner-dot"></div></div>${showTitle?`<div class="title">${safeTitle}</div><div class="rule"></div>`:''}<div class="text">${safeText}</div></div></div>`:''}
${template==='side_caption'?`<div class="glass side"><div class="inner"><div class="badge">${safeBadge}</div>${showTitle?`<div class="title">${safeTitle}</div><div class="rule"></div>`:''}<div class="text">${safeText}</div></div></div>`:''}
${template==='detail_card'?`<div class="glass detail"><div class="inner"><div class="badge">${safeBadge}</div>${showTitle?`<div class="title">${safeTitle}</div><div class="rule"></div>`:''}<div class="text">${safeText}</div></div></div>`:''}
${template==='tips_sticker'?`<div class="glass warn"><div class="inner"><div class="badge warning">${safeBadge}</div></div></div><div class="glass tip"><div class="inner"><div class="text">${safeText}</div></div></div>`:''}
${template==='formula_layout'?`<div class="glass formula"><div class="inner"><div class="badge">${safeBadge}</div>${showTitle?`<div class="title">${safeTitle}</div><div class="rule"></div>`:''}<div class="text">${safeText}</div></div></div>`:''}
</body></html>`;
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'fashion-overlay-service',
    version: '4.0.0',
    supported_languages: ['zh-CN', 'en', 'th', 'ms', 'emoji'],
    supported_style_packs: ['thai_fashion_luxury', 'malay_modest_luxury', 'sweet_daily_girl', 'magazine_editorial', 'clean_tips_card'],
    supported_templates: ['cover_hero', 'bottom_caption', 'side_caption', 'detail_card', 'tips_sticker', 'formula_layout'],
    supported_fields: ['image', 'badge', 'title', 'text', 'style_pack', 'template', 'page'],
  });
});

app.post('/overlay', upload.single('image'), async (req, res, next) => {
  let pageObj;
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, error: 'Missing multipart field: image' });
    }

    const badge = String(req.body.badge || '').trim();
    const title = String(req.body.title || '').trim();
    const text = String(req.body.text || '').trim();
    const page = Number(req.body.page || 1);
    const stylePack = normalizeStylePack(req.body.style_pack);
    const template = normalizeTemplate(req.body.template);

    const resized = await sharp(req.file.buffer)
      .rotate()
      .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 94, mozjpeg: true })
      .toBuffer();

    const html = buildHtml({
      imageBase64: resized.toString('base64'),
      badge,
      title,
      text,
      page,
      stylePack,
      template,
    });

    const browser = await getBrowser();
    pageObj = await browser.newPage({ viewport: { width: TARGET_W, height: TARGET_H }, deviceScaleFactor: 1 });
    await pageObj.setContent(html, { waitUntil: 'networkidle' });
    await pageObj.evaluateHandle('document.fonts.ready');
    const pngBuffer = await pageObj.screenshot({ type: 'png', fullPage: false, clip: { x: 0, y: 0, width: TARGET_W, height: TARGET_H } });
    await pageObj.close();

    const jpg = await sharp(pngBuffer)
      .resize(TARGET_W, TARGET_H, { fit: 'cover' })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.send(jpg);
  } catch (err) {
    try { if (pageObj) await pageObj.close(); } catch (_) {}
    next(err);
  }
});

app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ ok: false, error: 'Image is too large. Max size is 30MB.' });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
});

process.on('SIGTERM', async () => {
  try {
    if (browserPromise) {
      const browser = await browserPromise;
      await browser.close();
    }
  } finally {
    process.exit(0);
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`fashion-overlay-service v4 listening on 0.0.0.0:${PORT}`));
