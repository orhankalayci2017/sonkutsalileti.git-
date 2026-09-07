# Dal (Branch) Yönetimi

Bu repo iki kalıcı dal ile çalışır.

| Dal | Amaç | Kim yazar |
|---|---|---|
| `main` | Yayınlanmış, kararlı içerik. Doğrudan commit yapılmaz. | Sadece `development`'tan pull request ile |
| `development` | Aktif çalışma ve gözden geçirme alanı. | Özellik dallarından pull request ile |

## Akış

1. Her yeni sayfa veya değişiklik için `development`'tan bir özellik dalı aç.
   Adlandırma: `sayfa/<konu>` veya `duzeltme/<konu>` (örn. `sayfa/ilk-14-ayet`).
2. İş bitince özellik dalından `development`'a pull request aç.
3. `development` üzerinde içerik okunup onaylandıktan sonra `development` → `main` pull request'i ile yayınla.
4. Birleşen özellik dallarını sil.

## Kurallar

- `main`'e ve `development`'a doğrudan push yapılmaz; her şey pull request ile gelir.
- Zorla push (`--force`) kalıcı dallarda yasaktır.
- Bir pull request'te tek konu olsun; küçük ve okunabilir değişiklikler tercih edilir.
- Commit mesajları Türkçe ve açıklayıcı olsun: "İlk 14 ayet sayfasını ekle" gibi.

## Acil düzeltme

`main`'de bir hata varsa `main`'den `duzeltme/<konu>` dalı açılır, `main`'e birleştirilir,
ardından aynı dal `development`'a da birleştirilir ki iki dal ayrışmasın.
