// Hikâye: panel/HIKAYE.md — her test bir kabul kriterine karşılık gelir.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createApp } = require('../src/app');

const PASSWORD = 'dogru-sifre';
const ORIGINAL = '# İlk 14 Ayet\n\n1. Deneme ayeti.\n';

let server, base, contentDir, filePath;

before(async () => {
  contentDir = await fs.mkdtemp(path.join(os.tmpdir(), 'panel-'));
  filePath = path.join(contentDir, 'ilk-14-ayet-anlam-cevirisi.md');
  const app = createApp({
    contentDir,
    adminPassword: PASSWORD,
    sessionSecret: 'test-gizli-anahtar-uzun-ve-rastgele',
  });
  await new Promise((r) => { server = app.listen(0, '127.0.0.1', r); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await fs.rm(contentDir, { recursive: true, force: true });
});

beforeEach(async () => {
  await fs.writeFile(filePath, ORIGINAL);
});

// Yardımcılar: fetch yönlendirmeyi izlemez ki 302'leri görebilelim.
const get = (p, cookie) =>
  fetch(base + p, { redirect: 'manual', headers: cookie ? { cookie } : {} });
const post = (p, body, cookie) =>
  fetch(base + p, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...(cookie ? { cookie } : {}) },
    body: new URLSearchParams(body).toString(),
  });
const cookieOf = (res) => (res.headers.get('set-cookie') || '').split(';')[0];

async function login(password = PASSWORD) {
  const res = await post('/giris', { sifre: password });
  return { res, cookie: cookieOf(res) };
}
async function csrfOf(cookie) {
  const html = await (await get('/anlam-cevirisi/', cookie)).text();
  const m = html.match(/name="csrf" value="([^"]+)"/);
  assert.ok(m, 'editörde csrf alanı olmalı');
  return m[1];
}

test('1. oturum yokken editör /giris sayfasına yönlendirir', async () => {
  const res = await get('/anlam-cevirisi/');
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/giris');
});

test('2a. yanlış şifre oturum açmaz ve hata gösterir', async () => {
  const { res, cookie } = await login('yanlis');
  assert.equal(res.status, 401);
  assert.equal(cookie, '');
  assert.match(await res.text(), /Şifre yanlış/);
});

test('2b. doğru şifre oturum çerezi verir ve editöre yönlendirir', async () => {
  const { res, cookie } = await login();
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/anlam-cevirisi/');
  assert.match(cookie, /^oturum=.+/);
  assert.match(res.headers.get('set-cookie'), /HttpOnly/);
});

test('2c. 5 yanlış denemeden sonra doğru şifre bile 429 alır', async () => {
  // Ayrı bir uygulama ki diğer testlerin sayacıyla karışmasın.
  const app = createApp({
    contentDir, adminPassword: PASSWORD, sessionSecret: 'x'.repeat(32),
  });
  const s = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const b = `http://127.0.0.1:${s.address().port}`;
  try {
    for (let i = 0; i < 5; i++) {
      await fetch(b + '/giris', { method: 'POST', redirect: 'manual',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'sifre=yanlis' });
    }
    const res = await fetch(b + '/giris', { method: 'POST', redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `sifre=${PASSWORD}` });
    assert.equal(res.status, 429);
  } finally {
    await new Promise((r) => s.close(r));
  }
});

test('3. editör dosyanın güncel içeriğini kaçırılmış olarak gösterir', async () => {
  await fs.writeFile(filePath, '# Başlık\n\n</textarea><script>alert(1)</script>\n');
  const { cookie } = await login();
  const res = await get('/anlam-cevirisi/', cookie);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<textarea[^>]*name="icerik"/);
  assert.ok(html.includes('&lt;/textarea&gt;&lt;script&gt;'), 'içerik HTML olarak kaçırılmalı');
  assert.ok(!html.includes('</textarea><script>'), 'ham etiket sızmamalı');
});

test('4. kaydet dosyayı yazar, yönlendirir ve "Kaydedildi" gösterir', async () => {
  const { cookie } = await login();
  const csrf = await csrfOf(cookie);
  const yeni = '# Yeni\n\n1. Değişti. *(etiket)*\n';
  const res = await post('/anlam-cevirisi/', { icerik: yeni, csrf }, cookie);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/anlam-cevirisi/?kaydedildi=1');
  assert.equal(await fs.readFile(filePath, 'utf8'), yeni);
  const html = await (await get('/anlam-cevirisi/?kaydedildi=1', cookie)).text();
  assert.match(html, /Kaydedildi/);
  assert.ok(html.includes('1. Değişti. *(etiket)*'));
  // Geçici dosya kalmamalı.
  const kalan = (await fs.readdir(contentDir)).filter((f) => f !== path.basename(filePath));
  assert.deepEqual(kalan, []);
});

test('5a. ön izleme Markdown\'ı HTML olarak gösterir', async () => {
  const { cookie } = await login();
  const res = await get('/anlam-cevirisi/onizleme', cookie);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<h1[^>]*>İlk 14 Ayet<\/h1>/);
});

test('5b. ön izleme oturum ister', async () => {
  const res = await get('/anlam-cevirisi/onizleme');
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/giris');
});

test('6a. csrf olmadan kaydet 403 verir ve dosya değişmez', async () => {
  const { cookie } = await login();
  const res = await post('/anlam-cevirisi/', { icerik: 'kotu' }, cookie);
  assert.equal(res.status, 403);
  assert.equal(await fs.readFile(filePath, 'utf8'), ORIGINAL);
});

test('6b. oturum olmadan kaydet reddedilir ve dosya değişmez', async () => {
  const res = await post('/anlam-cevirisi/', { icerik: 'kotu', csrf: 'x' });
  assert.equal(res.status, 302);
  assert.equal(await fs.readFile(filePath, 'utf8'), ORIGINAL);
});

test('6c. sahte oturum çerezi kabul edilmez', async () => {
  const res = await get('/anlam-cevirisi/', 'oturum=uydurma.imza');
  assert.equal(res.status, 302);
});

test('7. çıkış oturumu kapatır', async () => {
  const { cookie } = await login();
  const csrf = await csrfOf(cookie);
  const res = await post('/cikis', { csrf }, cookie);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/giris');
  const sonra = await get('/anlam-cevirisi/', cookie);
  assert.equal(sonra.status, 302);
});

test('bilinmeyen sayfa 404 verir', async () => {
  const { cookie } = await login();
  const res = await get('/olmayan-sayfa/', cookie);
  assert.equal(res.status, 404);
});
