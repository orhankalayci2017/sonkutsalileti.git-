# Hikâye: Anlam çevirisi sayfasını yönetici olarak düzenleme

**Kim:** Site sahibi (tek yönetici, Orhan).
**Ne:** `https://panel.sonkutsalileti.com/anlam-cevirisi/` adresine girip anlam çevirisi
sayfasının Markdown metnini tarayıcıdan düzenleyip kaydetmek.
**Neden:** Her ayet eklemesi veya düzeltmesi için Claude'dan yardım istemek zorunda kalmamak.

## Kabul kriterleri

1. **Giriş zorunlu.** Oturum açmadan `/anlam-cevirisi/` istenirse editör görünmez; kullanıcı
   `/giris` sayfasına yönlendirilir.
2. **Şifre ile giriş.** `/giris` sayfasında tek alan (şifre) vardır. Şifre sunucuda ortam
   değişkeni olarak tutulur, kodda yazılı değildir. Yanlış şifrede oturum açılmaz ve hata
   mesajı gösterilir. Art arda 5 yanlış denemede aynı adresten 1 dakika giriş kabul edilmez.
3. **Editör.** Giriş yapıldıktan sonra `/anlam-cevirisi/` sayfasında, repodaki
   `ilk-14-ayet-anlam-cevirisi.md` dosyasının güncel içeriği bir metin alanında görünür.
4. **Kaydet.** "Kaydet" düğmesi dosyayı yeni içerikle üzerine yazar; yazma atomiktir (yarım
   dosya kalmaz). Kayıttan sonra editör yeniden açılır ve "Kaydedildi" notu görünür.
5. **Ön izleme.** `/anlam-cevirisi/onizleme` adresi, kayıtlı Markdown'ı HTML olarak gösterir;
   yalnızca oturum açmış kullanıcıya.
6. **Güvenlik.** Kaydetme isteği oturum çerezi ve sayfaya gömülü tek kullanımlık olmayan ama
   oturuma bağlı bir CSRF belirteci olmadan kabul edilmez. Metin alanına konan içerik
   HTML olarak kaçırılır (`</textarea>` içeren metin editörü bozmaz).
7. **Çıkış.** "Çıkış" düğmesi oturumu kapatır; sonrasında editör yine yönlendirir.
8. **Kapsam dışı.** Kayıt sırasında Git commit, sürüm geçmişi, çoklu kullanıcı, WYSIWYG
   editör yok. Bunlar ayrı hikâye.

## Çalıştırma sözleşmesi

- Ortam değişkenleri: `ADMIN_PASSWORD` (zorunlu), `SESSION_SECRET` (zorunlu, rastgele uzun
  dize), `CONTENT_DIR` (varsayılan: repo kökü), `PORT` (varsayılan 3000).
- Sayfa eşlemesi: `anlam-cevirisi` → `ilk-14-ayet-anlam-cevirisi.md`.
