# Proje: Son Kutsal İleti – Anlam Çevirisi

Kur'an ayetlerinin, modern yönetim ve organizasyon kavramlarıyla (servant leadership,
psychological safety, knowledge sharing, change management vb.) eşleştirilmiş serbest
anlam çevirileri. İçerik Türkçe, Markdown sayfaları halinde.

## Durum (7 Eylül 2026 itibarıyla)

- `ilk-14-ayet-anlam-cevirisi.md`: İlk 14 ayet yazıldı (Alak 1-5, Müddessir 1-7, Asr benzeri
  "çağlar arası geçiş" 1-2). Her ayetin sonunda parantez içinde yönetim kavramı etiketi var.
- `BRANCHING.md`: Dal yönetimi kuralları.
- GitHub ayarları tamamlandı: varsayılan dal `main`, `main` ve `development` korumalı,
  birleşen dallar otomatik silinir.

## Dal yapısı

- `main`: kararlı içerik. Doğrudan push yok; sadece `development`'tan pull request ile.
  Pull request zorunlu, onay şartı yok (tek kişilik repo).
- `development`: aktif çalışma. Doğrudan push serbest, zorla push ve silme yasak.
- Yeni sayfa için: `development`'tan `sayfa/<konu>` dalı aç → PR ile `development`'a → PR ile `main`'e.
- `claude/ilk-14-ayet-anlam-xdza0j`: ilk oturumun çalışma dalı, içeriği `main` ile aynı,
  silinebilir (kullanıcı henüz onaylamadı).

## Yazım kuralları (mevcut sayfadan çıkarılan)

- Başlıklar: sure/bölüm adı `##` ile, ayetler numaralı liste.
- Ayet metni serbest anlam çevirisi; sonunda *italik parantez* içinde Türkçe / İngilizce kavram
  etiketleri: `*(öz-yönetim / self-management, ...)*`.
- Kullanıcı metni birebir verir; metni değiştirme, sadece verildiği gibi yaz.
- Commit mesajları Türkçe.

## Sıradaki iş

Kullanıcı bir sonraki ayet grubunu verdiğinde: `development`'tan yeni dal aç, sayfayı ekle,
`development`'a PR aç.

## Kullanıcı tercihleri

- Türkçe yaz. Kısa ve net ol, övgü ekleme.
- İstenmeyen kapsam ekleme; ek fikir varsa önce öner.
- Emin olmadığında söyle.
- GitHub arayüzü işleri (ayarlar vb.) için Chrome'daki Claude eklentisi kullanılıyor;
  yerel oturum tarayıcıya bağlanabiliyorsa doğrudan yapabilir.
