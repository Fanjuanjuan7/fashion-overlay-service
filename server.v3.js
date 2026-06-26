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
      cardBg: 'rgba(250, 244, 238, 0.62)', cardBgStrong: 'rgba(250, 244, 238, 0.72)',
      cardDark: 'rgba(18, 15, 13, 0.40)', cardBorder: 'rgba(255,255,255,0.42)',
      title: '#86565b', text: '#8b6062', titleOnDark: '#fff9f0', textOnDark: '#fffdf8',
      muted: 'rgba(112,82,78,.68)', accent: '#c99b8f', shadow: 'rgba(56, 34, 24, 0.20)',
      pageFade: 'linear-gradient(to top, rgba(62,42,34,.24), rgba(62,42,34,.08), rgba(62,42,34,0))', radius: 46,
    },
    malay_modest_luxury: {
      name: 'malay_modest_luxury', fontFamily,
      cardBg: 'rgba(249, 243, 232, 0.62)', cardBgStrong: 'rgba(252, 247, 238, 0.74)',
      cardDark: 'rgba(30, 25, 20, 0.36)', cardBorder: 'rgba(129, 105, 78, 0.28)',
      title: '#6f5641', text: '#675546', titleOnDark: '#fff8ee', textOnDark: '#fffdf8',
      muted: 'rgba(103,85,70,.68)', accent: '#b99768', shadow: 'rgba(69,52,35,0.18)',
      pageFade: 'linear-gradient(to top, rgba(64,47,34,.20), rgba(255,255,255,.03), rgba(255,255,255,0))', radius: 44,
    },
    sweet_daily_girl: {
      name: 'sweet_daily_girl', fontFamily,
      cardBg: 'rgba(255, 246, 242, 0.62)', cardBgStrong: 'rgba(255, 249, 246, 0.76)',
      cardDark: 'rgba(100, 62, 70, 0.28)', cardBorder: 'rgba(234, 174, 188, 0.34)',
      title: '#9a5d68', text: '#8d6468', titleOnDark: '#fff9f8', textOnDark: '#fffdfd',
      muted: 'rgba(141,100,104,.66)', accent: '#e4a6b7', shadow: 'rgba(154, 93, 105, 0.17)',
      pageFade: 'linear-gradient(to top, rgba(240,188,199,.18), rgba(255,255,255,.02), rgba(255,255,255,0))', radius: 52,
    },
    magazine_editorial: {
      name: 'magazine_editorial', fontFamily,
      cardBg: 'rgba(18, 15, 13, 0.36)', cardBgStrong: 'rgba(18, 15, 13, 0.46)',
      cardDark: 'rgba(10, 8, 7, 0.46)', cardBorder: 'rgba(255,255,255,0.24)',
      title: '#fff8ef', text: '#fffdf8', titleOnDark: '#fff8ef', textOnDark: '#fffdf8',
      muted: 'rgba(255,255,255,.74)', accent: '#f0d28a', shadow: 'rgba(0,0,0,.30)',
      pageFade: 'linear-gradient(to top, rgba(0,0,0,.50), rgba(0,0,0,.16), rgba(0,0,0,0))', radius: 28,
    },
    clean_tips_card: {
      name: 'clean_tips_card', fontFamily,
      cardBg: 'rgba(250, 247, 240, 0.62)', cardBgStrong: 'rgba(252, 249, 243, 0.76)',
      cardDark: 'rgba(36, 30, 25, 0.34)', cardBorder: 'rgba(112, 90, 68, 0.24)',
      title: '#6d5141', text: '#675349', titleOnDark: '#fff8ee', textOnDark: '#fffdf8',
      muted: 'rgba(103,83,73,.68)', accent: '#b79968', shadow: 'rgba(47, 38, 28, 0.16)',
      pageFade: 'linear-gradient(to top, rgba(58,45,32,.16), rgba(255,255,255,.02), rgba(255,255,255,0))', radius: 40,
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
  const darkMode = stylePack === 'magazine_editorial';
  const cardBg = darkMode ? s.cardDark : s.cardBg;
  const cardBgStrong = darkMode ? s.cardDark : s.cardBgStrong;
  const titleColor = darkMode ? s.titleOnDark : s.title;
  const textColor = darkMode ? s.textOnDark : s.text;

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
*{box-sizing:border-box}html,body{margin:0;width:${TARGET_W}px;height:${TARGET_H}px;overflow:hidden;font-family:${s.fontFamily}}body{position:relative;background:#eee}.bg{position:absolute;inset:0;width:${TARGET_W}px;height:${TARGET_H}px;object-fit:cover}.fade-bottom{position:absolute;left:0;right:0;bottom:0;height:620px;background:${s.pageFade};pointer-events:none}.safe-top-right{position:absolute;top:0;right:0;width:300px;height:210px;pointer-events:none}.glass{position:absolute;border:1.5px solid ${s.cardBorder};background:${cardBg};color:${textColor};border-radius:${s.radius}px;box-shadow:0 18px 58px ${s.shadow};backdrop-filter:blur(26px) saturate(1.12);-webkit-backdrop-filter:blur(26px) saturate(1.12);overflow:hidden}.glass:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.38),rgba(255,255,255,.08),rgba(255,255,255,.20));pointer-events:none}.inner{position:relative;z-index:1}.title{color:${titleColor};font-weight:850;letter-spacing:-.025em;line-height:1.12;white-space:pre-line;text-wrap:balance;text-shadow:0 2px 0 rgba(255,255,255,.22),0 12px 30px rgba(0,0,0,.16);-webkit-text-stroke:.25px rgba(80,50,45,.16)}.text{color:${textColor};font-weight:650;letter-spacing:.005em;line-height:1.42;white-space:pre-line;text-wrap:balance;text-shadow:0 1px 0 rgba(255,255,255,.20),0 10px 24px rgba(0,0,0,.10)}.accent-line{height:1.6px;background:linear-gradient(90deg,rgba(255,255,255,0),${s.accent},rgba(255,255,255,0));opacity:.62}.thin-line{height:1.3px;background:linear-gradient(90deg,rgba(255,255,255,0),${s.accent},rgba(255,255,255,0));opacity:.55}.kicker{position:absolute;left:78px;top:118px;color:${darkMode?'rgba(255,255,255,.58)':s.muted};font-size:27px;letter-spacing:.25em;font-weight:780}.brand-foot{position:absolute;left:70px;bottom:70px;font-size:22px;letter-spacing:.20em;color:${darkMode?'rgba(255,255,255,.58)':s.muted}}
/* 1 封面：卡片变薄，标题有层次 */.tpl-cover_hero .fade-bottom{height:760px}.tpl-cover_hero .hero{left:66px;bottom:225px;width:840px;padding:46px 55px 45px;border-radius:${s.radius}px;background:${cardBgStrong}}.tpl-cover_hero .hero .title{font-size:${pageNum===1?78:68}px;max-width:740px}.tpl-cover_hero .hero .text{font-size:36px;margin-top:24px;max-width:750px;font-weight:590}.tpl-cover_hero .hero .accent-line{width:340px;margin:24px 0 0}
/* 2 普通底部：必须支持标题，整体更轻、更像海报 */.tpl-bottom_caption .bottom{left:76px;right:76px;bottom:168px;padding:36px 50px 38px;text-align:center;background:${cardBgStrong};border-radius:42px}.tpl-bottom_caption .bottom .title{font-size:42px;margin-bottom:11px}.tpl-bottom_caption .bottom .text{font-size:37px;font-weight:590}.tpl-bottom_caption .bottom .thin-line{width:170px;margin:24px auto 0}
/* 3 侧边：如果有留白，用小卡片，不挡主体 */.tpl-side_caption .side{right:70px;top:570px;width:395px;min-height:410px;padding:42px 38px;background:${cardBgStrong};border-radius:38px}.tpl-side_caption .side .title{font-size:41px;margin-bottom:18px}.tpl-side_caption .side .text{font-size:34px;line-height:1.46;font-weight:590}.tpl-side_caption .side .thin-line{width:200px;margin:0 0 24px}
/* 4 细节卡片：更小、更透明 */.tpl-detail_card .detail{right:72px;bottom:408px;width:430px;padding:36px 36px;background:${cardBgStrong};border-radius:34px}.tpl-detail_card .detail .title{font-size:40px;margin-bottom:18px}.tpl-detail_card .detail .text{font-size:32px;line-height:1.46;font-weight:590}.tpl-detail_card .detail .thin-line{width:210px;margin:0 0 22px}
/* 5 避坑/技巧：贴纸更精致，正文更轻 */.tpl-tips_sticker .sticker-title{left:70px;top:145px;padding:22px 38px;max-width:560px;background:${cardBgStrong};border-radius:32px;transform:rotate(-1.1deg)}.tpl-tips_sticker .sticker-title .title{font-size:42px}.tpl-tips_sticker .tip{right:72px;bottom:438px;width:445px;padding:38px 38px;background:${cardBgStrong};border-radius:34px}.tpl-tips_sticker .tip .text{font-size:33px;line-height:1.48;font-weight:590}
/* 6 公式页：改成右侧小卡片，不再大面积遮人 */.tpl-formula_layout .formula{right:62px;top:335px;width:430px;min-height:0;max-height:710px;padding:42px 38px 38px;background:${cardBgStrong};border-radius:40px}.tpl-formula_layout .formula .title{font-size:39px;margin-bottom:22px}.tpl-formula_layout .formula .text{font-size:34px;line-height:1.52;text-align:center;font-weight:650}.tpl-formula_layout .formula .thin-line{width:210px;margin:0 auto 25px}
</style></head><body class="tpl-${template} style-${stylePack}"><img class="bg" src="data:image/jpeg;base64,${imageBase64}"/><div class="fade-bottom"></div><div class="safe-top-right"></div>
${template==='cover_hero'?`<div class="kicker">DAILY OUTFIT</div><div class="glass hero"><div class="inner"><div class="title">${showTitle?safeTitle:safeText}</div>${showTitle&&safeText?`<div class="accent-line"></div><div class="text">${safeText}</div>`:''}</div></div><div class="brand-foot">STYLE IS AN ATTITUDE</div>`:''}
${template==='bottom_caption'?`<div class="glass bottom"><div class="inner">${showTitle?`<div class="title">${safeTitle}</div>`:''}<div class="text">${safeText}</div><div class="thin-line"></div></div></div>`:''}
${template==='side_caption'?`<div class="glass side"><div class="inner">${showTitle?`<div class="title">${safeTitle}</div><div class="thin-line"></div>`:''}<div class="text">${safeText}</div></div></div>`:''}
${template==='detail_card'?`<div class="glass detail"><div class="inner">${showTitle?`<div class="title">${safeTitle}</div><div class="thin-line"></div>`:''}<div class="text">${safeText}</div></div></div>`:''}
${template==='tips_sticker'?`${showTitle?`<div class="glass sticker-title"><div class="inner"><div class="title">${safeTitle}</div></div></div>`:''}<div class="glass tip"><div class="inner"><div class="text">${safeText}</div></div></div>`:''}
${template==='formula_layout'?`<div class="glass formula"><div class="inner">${showTitle?`<div class="title">${safeTitle}</div>`:''}<div class="thin-line"></div><div class="text">${safeText}</div></div></div>`:''}
</body></html>`;
}

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'fashion-overlay-service', version: '3.0.0', supported_languages: ['zh-CN','en','th','ms','emoji'], supported_style_packs: ['thai_fashion_luxury','malay_modest_luxury','sweet_daily_girl','magazine_editorial','clean_tips_card'], supported_templates: ['cover_hero','bottom_caption','side_caption','detail_card','tips_sticker','formula_layout'] });
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

app.listen(PORT, '0.0.0.0', () => console.log(`fashion-overlay-service v3 listening on 0.0.0.0:${PORT}`));
