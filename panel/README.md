# Panel – anlam çevirisi sayfasını tarayıcıdan düzenleme

Hikâye ve kabul kriterleri: `HIKAYE.md`. Testler: `test/panel.test.js`. Kod: `src/`.

## Yerelde çalıştırma

```bash
cd panel
npm install
ADMIN_PASSWORD='güçlü-bir-şifre' SESSION_SECRET="$(head -c 32 /dev/urandom | base64)" npm start
```

Tarayıcıda `http://localhost:3000/anlam-cevirisi/` adresine gidin, şifreyi girin, metni düzenleyip
**Kaydet** deyin. Dosya doğrudan repo kökündeki `ilk-14-ayet-anlam-cevirisi.md` üzerine yazılır.

## Testler

```bash
npm test
```

## Sunucuya kurulum (panel.sonkutsalileti.com)

1. Repoyu sunucuya klonlayın; `panel/` içinde `npm install --omit=dev`.
2. Ortam değişkenlerini verin: `ADMIN_PASSWORD`, `SESSION_SECRET`, isteğe bağlı `CONTENT_DIR`
   (varsayılan repo kökü) ve `PORT` (varsayılan 3000).
3. Uygulamayı bir süreç yöneticisiyle (systemd, pm2) ayakta tutun.
4. `panel.sonkutsalileti.com` alan adını HTTPS ile bu porta yönlendiren bir ters vekil (nginx,
   Caddy) kurun. Uygulama `trust proxy` açık; `X-Forwarded-Proto: https` başlığı gelince çerez
   `Secure` işaretlenir.

Kaydedilen metin sunucudaki dosyaya yazılır; Git'e commit **edilmez**. Değişiklikleri repoya
almak için sunucuda `git commit` gerekir. Bu, ayrı bir hikâye olarak ele alınabilir.
