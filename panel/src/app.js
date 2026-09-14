'use strict';
// Anlam çevirisi sayfası için yönetici paneli. Hikâye ve kabul kriterleri: panel/HIKAYE.md
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const { marked } = require('marked');

// Panel adresi → repodaki Markdown dosyası.
const SAYFALAR = {
  'anlam-cevirisi': 'ilk-14-ayet-anlam-cevirisi.md',
};

const OTURUM_SURESI_SN = 12 * 60 * 60; // 12 saat
const MAKS_YANLIS = 5;
const KILIT_MS = 60 * 1000;

const kacir = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sayfa = (baslik, govde) => `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${kacir(baslik)} – Son Kutsal İleti Paneli</title>
<style>
  body{font:16px/1.5 system-ui,sans-serif;max-width:60rem;margin:2rem auto;padding:0 1rem;color:#222}
  textarea{width:100%;min-height:70vh;font:14px/1.5 ui-monospace,monospace;padding:.75rem;box-sizing:border-box}
  .bar{display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin:1rem 0}
  .not{background:#e6f4ea;border:1px solid #9bd0a8;padding:.5rem .75rem;border-radius:4px}
  .hata{background:#fdecea;border:1px solid #f5a09a;padding:.5rem .75rem;border-radius:4px}
  button{padding:.5rem 1rem;font-size:1rem}
</style></head><body>${govde}</body></html>`;

function createApp({ contentDir, adminPassword, sessionSecret }) {
  if (!adminPassword) throw new Error('adminPassword zorunlu');
  if (!sessionSecret || sessionSecret.length < 16) throw new Error('sessionSecret en az 16 karakter olmalı');

  const imzala = (veri) => crypto.createHmac('sha256', sessionSecret).update(veri).digest('base64url');

  // Oturum çerezi: "<sonKullanma>.<rastgele>.<imza>"
  const oturumUret = () => {
    const govde = `${Math.floor(Date.now() / 1000) + OTURUM_SURESI_SN}.${crypto.randomBytes(16).toString('base64url')}`;
    return `${govde}.${imzala(govde)}`;
  };
  // Çıkış yapılan oturumlar; imzalı belirteç süresi dolana kadar burada tutulur.
  const iptalEdilenler = new Map();
  const iptalTemizle = () => {
    const simdi = Date.now() / 1000;
    for (const [k, son] of iptalEdilenler) if (son < simdi) iptalEdilenler.delete(k);
  };
  const oturumGecerli = (deger) => {
    if (!deger || iptalEdilenler.has(deger)) return false;
    const son = deger.lastIndexOf('.');
    if (son < 0) return false;
    const govde = deger.slice(0, son);
    const imza = Buffer.from(deger.slice(son + 1));
    const beklenen = Buffer.from(imzala(govde));
    if (imza.length !== beklenen.length || !crypto.timingSafeEqual(imza, beklenen)) return false;
    const sonKullanma = Number(govde.split('.')[0]);
    return Number.isFinite(sonKullanma) && sonKullanma > Date.now() / 1000;
  };
  // CSRF belirteci oturuma bağlı: aynı gizli anahtarla oturum değerinin imzası.
  const csrfUret = (oturum) => imzala(`csrf:${oturum}`);
  const csrfGecerli = (oturum, verilen) => {
    if (typeof verilen !== 'string') return false;
    const a = Buffer.from(verilen);
    const b = Buffer.from(csrfUret(oturum));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };

  const cerezOku = (req) => {
    const ham = req.headers.cookie || '';
    for (const parca of ham.split(';')) {
      const [ad, ...deger] = parca.trim().split('=');
      if (ad === 'oturum') return deger.join('=');
    }
    return '';
  };

  // Giriş denemesi kilidi (adres başına).
  const denemeler = new Map();
  const kilitli = (ip) => {
    const k = denemeler.get(ip);
    return k && k.sayi >= MAKS_YANLIS && Date.now() - k.son < KILIT_MS;
  };
  const yanlisDeneme = (ip) => {
    const k = denemeler.get(ip) || { sayi: 0, son: 0 };
    if (Date.now() - k.son > KILIT_MS) k.sayi = 0;
    k.sayi += 1;
    k.son = Date.now();
    denemeler.set(ip, k);
  };

  const sifreDogru = (verilen) => {
    const a = Buffer.from(String(verilen || ''));
    const b = Buffer.from(adminPassword);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  };

  const dosyaYolu = (slug) => path.join(contentDir, SAYFALAR[slug]);

  async function atomikYaz(hedef, icerik) {
    const gecici = `${hedef}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    try {
      await fs.writeFile(gecici, icerik, 'utf8');
      await fs.rename(gecici, hedef);
    } catch (e) {
      await fs.rm(gecici, { force: true });
      throw e;
    }
  }

  const app = express();
  app.disable('x-powered-by');
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));

  app.use((req, res, next) => {
    const oturum = cerezOku(req);
    req.oturum = oturumGecerli(oturum) ? oturum : null;
    next();
  });
  const girisGerekli = (req, res, next) => (req.oturum ? next() : res.redirect(302, '/giris'));

  const girisFormu = (hata) => sayfa('Giriş', `
    <h1>Giriş</h1>
    ${hata ? `<p class="hata">${kacir(hata)}</p>` : ''}
    <form method="post" action="/giris">
      <p><label>Şifre <input type="password" name="sifre" autofocus required></label></p>
      <button type="submit">Giriş yap</button>
    </form>`);

  app.get('/giris', (req, res) => {
    if (req.oturum) return res.redirect(302, '/anlam-cevirisi/');
    res.send(girisFormu());
  });

  app.post('/giris', (req, res) => {
    const ip = req.ip;
    if (kilitli(ip)) return res.status(429).send(girisFormu('Çok fazla yanlış deneme. 1 dakika sonra tekrar deneyin.'));
    if (!sifreDogru(req.body.sifre)) {
      yanlisDeneme(ip);
      return res.status(401).send(girisFormu('Şifre yanlış.'));
    }
    denemeler.delete(ip);
    res.cookie('oturum', oturumUret(), {
      httpOnly: true, sameSite: 'lax', path: '/', maxAge: OTURUM_SURESI_SN * 1000,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    });
    res.redirect(302, '/anlam-cevirisi/');
  });

  app.post('/cikis', girisGerekli, (req, res) => {
    if (!csrfGecerli(req.oturum, req.body.csrf)) return res.status(403).send('Geçersiz istek.');
    iptalTemizle();
    iptalEdilenler.set(req.oturum, Number(req.oturum.split('.')[0]));
    res.clearCookie('oturum', { path: '/' });
    res.redirect(302, '/giris');
  });

  app.get('/', (req, res) => res.redirect(302, '/anlam-cevirisi/'));

  const slugKontrol = (req, res, next) => (SAYFALAR[req.params.slug] ? next() : res.status(404).send('Sayfa yok.'));

  app.get('/:slug/', girisGerekli, slugKontrol, async (req, res, next) => {
    try {
      const icerik = await fs.readFile(dosyaYolu(req.params.slug), 'utf8');
      const csrf = csrfUret(req.oturum);
      res.send(sayfa(req.params.slug, `
        <h1>${kacir(req.params.slug)}</h1>
        ${req.query.kaydedildi ? '<p class="not">Kaydedildi.</p>' : ''}
        <form method="post" action="/${kacir(req.params.slug)}/">
          <input type="hidden" name="csrf" value="${csrf}">
          <textarea name="icerik" spellcheck="false">${kacir(icerik)}</textarea>
          <div class="bar">
            <button type="submit">Kaydet</button>
            <a href="/${kacir(req.params.slug)}/onizleme" target="_blank">Ön izleme</a>
          </div>
        </form>
        <form method="post" action="/cikis"><input type="hidden" name="csrf" value="${csrf}"><button type="submit">Çıkış</button></form>`));
    } catch (e) { next(e); }
  });

  app.post('/:slug/', girisGerekli, slugKontrol, async (req, res, next) => {
    try {
      if (!csrfGecerli(req.oturum, req.body.csrf)) return res.status(403).send('Geçersiz istek (csrf).');
      if (typeof req.body.icerik !== 'string') return res.status(400).send('İçerik eksik.');
      await atomikYaz(dosyaYolu(req.params.slug), req.body.icerik.replace(/\r\n/g, '\n'));
      res.redirect(302, `/${req.params.slug}/?kaydedildi=1`);
    } catch (e) { next(e); }
  });

  app.get('/:slug/onizleme', girisGerekli, slugKontrol, async (req, res, next) => {
    try {
      const md = await fs.readFile(dosyaYolu(req.params.slug), 'utf8');
      res.send(sayfa(`${req.params.slug} ön izleme`, marked.parse(md)));
    } catch (e) { next(e); }
  });

  app.use((req, res) => res.status(404).send('Sayfa yok.'));
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error(err);
    res.status(500).send('Sunucu hatası.');
  });

  return app;
}

module.exports = { createApp, SAYFALAR };
