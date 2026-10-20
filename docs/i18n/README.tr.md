<div align="center">

<img src="../images/logo.svg" width="96" alt="Briefing logosu">

# Briefing

**Ekibinizin ikinci beyni — yerel Markdown notları, eşler arası (peer‑to‑peer) paylaşılan ve Claude tarafından okunabilen.**

[![CI](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml/badge.svg)](https://github.com/renankelm10/briefingMCP/actions/workflows/ci.yml)
[![Lisans: MIT](https://img.shields.io/badge/lisans-MIT-e3a43a.svg)](../../LICENSE)
![Platformlar](https://img.shields.io/badge/platformlar-Windows%20%7C%20macOS%20%7C%20Linux-555)
![MCP](https://img.shields.io/badge/MCP-Claude%20için%20hazır-d97757)

<a href="https://github.com/renankelm10/briefingMCP/releases/latest"><img src="https://img.shields.io/badge/%C4%B0ndir-Windows%20%7C%20macOS%20%7C%20Linux-e3a43a?style=for-the-badge&logo=github&logoColor=white" alt="İndir" height="40"></a>
<a href="https://github.com/renankelm10/briefingMCP/releases"><img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Frenankelm10%2FbriefingMCP%2Fmain%2Fdocs%2Fdownloads.json&style=for-the-badge" alt="Downloads" height="40"></a>


<!-- langs -->
[English](../../README.md) · [Português](README.pt-BR.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · **Türkçe** · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md)
<!-- /langs -->

<img src="../images/01-editor.png" alt="Canlı önizleme, sekmeler ve geri bağlantılarla Briefing düzenleyicisi" width="900">

</div>

---

## Briefing nedir?

Briefing, **arada bir bulut hizmeti olmadan tek bir ortak bilgi tabanı** isteyen ekipler için yapılmış bir masaüstü not uygulamasıdır.

- 📝 Bilgisayarınızdaki sıradan bir klasörde (sizin "vault"unuzda) duran düz Markdown dosyalarıyla **yazın**.
- 🔄 Bir klasörü ekibinizle **paylaşın**: her bilgisayar birebir aynı kopyayı tutar ve değişiklikler uçtan uca şifreli olarak, saniyeler içinde **doğrudan bilgisayardan bilgisayara** gider.
- 🧠 Her şeyi **sorun**: her not, **kendi makinenizde** çalışan bir yapay zekâ modeliyle dizinlenir; **Claude** (ya da herhangi bir MCP istemcisi) yerleşik MCP sunucusu üzerinden notlarınızda arama yapabilir, onları okuyabilir ve yazabilir.

Sonuç: Siz ve bir ekip arkadaşınız aynı anda, her biriniz kendi Claude'unuzla, aynı şirket bilgisi üzerinde çalışabilir ve her zaman en güncel sürümü görebilirsiniz.

> Arayüz şu anda **Brezilya Portekizcesi** dilindedir. Çevirilere açığız — bkz. [Katkıda bulunma](../../CONTRIBUTING.md).

## Nasıl çalışır?

<div align="center"><img src="../images/architecture.svg" alt="Mimari: iki bilgisayar doğrudan eşitlenir; her birinde Claude'un MCP ile okuduğu yerel bir yapay zekâ dizini vardır" width="860"></div>

1. **Bir ekip oluşturur** ve bir klasör seçersiniz. Briefing `BRF-7Q2M-…` gibi bir davet kodu üretir.
2. **Ekip arkadaşınız kodu yapıştırır.** Bilgisayarlar, *yalnızca* keşif için kullanılan herkese açık [Hyperswarm](https://github.com/holepunchto/hyperswarm) DHT'si üzerinden birbirini bulur ve Noise ile şifrelenmiş doğrudan bir bağlantı açar. Tek bir dosya bile gönderilmeden önce her iki taraf da kodu bildiğini kanıtlar.
3. **Her değişiklik anında gönderilir** — onu siz, ekip arkadaşınız ya da bir Claude yazmış olsun. Eşzamanlı düzenlemeler satır satır birleştirilir (Git gibi); iki kişi aynı satırları değiştirirse diğer sürüm, her bilgisayarda aynı olan bir *çakışma kopyası* olarak saklanır — hiçbir şey kaybolmaz.
4. **Her bilgisayar notları yerel olarak dizinler** (çok dilli embedding'ler + anahtar kelime araması). Claude dizini MCP üzerinden sorgular ve en alakalı bölümleri milisaniyeler içinde alır.

## Özellikler

<table>
<tr>
<td width="50%"><img src="../images/02-reading.png" alt="Okuma modu"></td>
<td width="50%"><img src="../images/08-teams.png" alt="Ekip klasörleri"></td>
</tr>
<tr>
<td><b>Yazma.</b> Canlı önizlemeli düzenleyici, otomatik tamamlamalı <code>[[bağlantılar]]</code>, geri bağlantılar, etiketler, bilgi kutuları, görevler, tablolar, gömmeler, özellikler, görsel yapıştırma, şablonlar, günlük notlar.</td>
<td><b>Ekip klasörleri.</b> Bir ekip oluşturun, kodu paylaşın; klasör her bilgisayarda aynı kalır. Canlı çevrim içi durumu, birleştirme, çakışma kopyaları, geçmiş.</td>
</tr>
<tr>
<td><img src="../images/04-brain-search.png" alt="Anlamsal arama"></td>
<td><img src="../images/05-brain-claude.png" alt="Claude'u bağlama"></td>
</tr>
<tr>
<td><b>İkinci beyin.</b> <kbd>Ctrl</kbd>+<kbd>J</kbd> doğal dilde bir soru sorar. Hibrit arama (anlam + tam sözcükler); modelin ilk indirilmesinden sonra tamamen çevrim dışı.</td>
<td><b>MCP ile Claude.</b> Tek tıkla MCP sunucusu Claude Code'a kaydedilir. Claude <code>search</code>, <code>read_note</code>, <code>write_note</code> ve daha fazlasını kazanır.</td>
</tr>
<tr>
<td><img src="../images/03-graph.png" alt="Grafik görünümü"></td>
<td><img src="../images/06-tasks.png" alt="Görevler paneli"></td>
</tr>
<tr>
<td><b>Grafik.</b> Notların nasıl bağlandığını görün; yerel grafik, filtre, sürükleme ve yakınlaştırma.</td>
<td><b>Görevler ve ajanda.</b> Vault'taki tüm <code>- [ ]</code> öğeleri tek panelde, ayrıca günlük notlar takvimi.</td>
</tr>
</table>

<details>
<summary><b>Tüm özellikler</b></summary>

- Sekmeler (yeniden başlatınca geri gelir), hızlı geçiş, komut paleti, tam metin ve `#etiket` araması
- Canlı önizleme: Markdown sözdizimi düzenlediğiniz satırın dışında gizlenir; tablolar, bilgi kutuları, görseller ve onay kutuları doğrudan görünür
- Bağlantıların üzerine gelince önizleme, tek tıkla bağlanabilen bağlantısız anmalar
- Bir notu yeniden adlandırmak ya da taşımak ona giden tüm bağlantıları günceller
- Değişkenli şablonlar (`{{title}}`, `{{date:DD/MM/YYYY}}`, `{{time}}`) ve hazır bir **proje brifingi** şablonu
- Her not için geri yüklenebilir sürüm geçmişi; silinenler sistem çöp kutusuna gider
- Notu PDF olarak dışa aktarma
- Açık / koyu / sistem teması, vurgu rengi, yazı boyutu, satır genişliği, boyutlandırılabilir paneller, odak modu
- Mevcut Markdown klasörleriyle çalışır (Obsidian vault'ları dahil)

</details>

## Kurulum

Sisteminiz için en son sürümü **[Releases](https://github.com/renankelm10/briefingMCP/releases)** sayfasından indirin.

| Sistem | Dosya | Notlar |
|---|---|---|
| Windows 10/11 | `Briefing-Setup-x.y.z.exe` | Henüz imzalı değil: SmartScreen uyarısında **Ek bilgi → Yine de çalıştır**'a tıklayın. |
| macOS 12+ (Apple Silicon) | `Briefing-x.y.z-arm64.dmg` | Henüz noter onaylı değil: uygulamaya sağ tıklayın → **Aç** ya da `xattr -dr com.apple.quarantine /Applications/Briefing.app` komutunu çalıştırın. Intel Mac: kaynak koddan derleyin. |
| Linux (x64) | `Briefing-x.y.z.AppImage` / `.deb` | AppImage: `chmod +x Briefing-*.AppImage`. Ubuntu 24.04+ sürümlerinde Chromium sandbox'ını ayarlayan `.deb` paketini tercih edin (`sudo apt install ./briefing_*.deb`). |

İlk açılışta Briefing, `Belgeler/Briefing` içinde örnek bir vault oluşturur. Herhangi bir klasörü açmak için **Arquivo → Abrir outro vault…** seçeneğini kullanın.

### Kaynak koddan derleme

[Node.js 22+](https://nodejs.org) gerekir.

```bash
git clone https://github.com/renankelm10/briefingMCP.git
cd briefingMCP
npm install
npm start            # uygulamayı çalıştırır
npm run dist         # sisteminiz için kurulum dosyası oluşturur (release/ içinde)
```

## 3 adımda ekip klasörleri

1. Paylaşmak istediğiniz klasörü vault olarak açın ve <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> (**Equipes**) tuşlarına basın.
2. **Criar equipe** → davet kodu kopyalanır. Kodu ekip arkadaşınıza özel bir kanaldan gönderin.
3. Ekip arkadaşınız **Equipes → Entrar numa equipe** bölümünü açar, kodu yapıştırır ve boş bir klasör seçer. Dosyalar, iki bilgisayar da çevrim içi olur olmaz gelir.

Eşitleme için Briefing'in iki bilgisayarda da açık olması gerekir. Kodu olan herkes tam üye olur — onu bir parola gibi saklayın.

## Claude'u bağlama (MCP)

**✦ Segundo cérebro → Conectar automaticamente** seçeneğini açın ya da şunu çalıştırın:

```bash
claude mcp add briefing --scope user -- node "/yol/briefingMCP/src/mcp/server.mjs"
```

Claude Code'u yeniden başlatın. Sunucu açık vault'u ve tüm ekip klasörlerini sunar:

| Araç | Ne yapar |
|---|---|
| `search` | Hibrit anlamsal + anahtar kelime araması; en alakalı bölümleri dosya ve satır bilgisiyle döndürür |
| `read_note` | Bir notun tam içeriği (yol ile ya da yalnızca adıyla) |
| `list_notes` | Bir vault ya da klasördeki notlar, değiştirilme zamanlarıyla |
| `recent_changes` | Son değiştirilen notlar — ekip arkadaşlarından gelen değişiklikler dahil |
| `write_note` | Not oluşturur, üzerine yazar ya da ekleme yapar (ekiple anında eşitlenir) |
| `vault_info` | Vault'lar, dizinlenmiş not/bölüm sayısı, anlamsal arama durumu |

stdio sunucularını destekleyen her MCP istemcisi aynı şekilde çalışır. Vault'ları açıkça seçmek için `BRIEFING_VAULTS="/a;/b"` kullanın.

## Güvenlik ve gizlilik

- Hesap yok, sunucu yok, telemetri yok. Notlar diskinizdeki sıradan dosyalardır.
- Eşitleme bağlantıları uçtan uca şifrelidir ve davet koduyla doğrulanır; ağdan gelen dosyalar asla paylaşılan klasörün dışına yazılamaz ve Briefing başkalarından gelen çalıştırılabilir dosyaları asla açmaz.
- Embedding'ler yerel olarak hesaplanır; model (`multilingual-e5-small`, ~120 MB) Hugging Face'ten bir kez indirilir.
- MCP yanıtları, prompt injection riskini azaltmak için not içeriğini güvenilmeyen veri olarak işaretler.

Tehdit modelinin tamamını **[SECURITY.md](../../SECURITY.md)** dosyasında okuyun. Güvenlik açıklarını gizli olarak bildirin.

## Klavye kısayolları

| Kısayol | Eylem | Kısayol | Eylem |
|---|---|---|---|
| <kbd>Ctrl</kbd>+<kbd>O</kbd> | Hızlı geçiş | <kbd>Ctrl</kbd>+<kbd>J</kbd> | İkinci beyne sor |
| <kbd>Ctrl</kbd>+<kbd>P</kbd> | Komut paleti | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> | Ekip klasörleri |
| <kbd>Ctrl</kbd>+<kbd>N</kbd> | Yeni not | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>B</kbd> | Yeni proje brifingi |
| <kbd>Ctrl</kbd>+<kbd>E</kbd> | Okuma / düzenleme | <kbd>Ctrl</kbd>+<kbd>G</kbd> | Grafik |
| <kbd>Ctrl</kbd>+<kbd>T</kbd> / <kbd>W</kbd> | Yeni / sekmeyi kapat | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd> | Günlük not |

macOS'ta <kbd>Ctrl</kbd> yerine <kbd>⌘</kbd> kullanın.

## SSS

**Bu Obsidian mı?** Hayır. Briefing, sıfırdan yazılmış bağımsız ve açık kaynaklı bir projedir. Sıradan Markdown klasörleriyle uyumludur, bu yüzden mevcut bir vault'u açabilirsiniz; ancak Obsidian ile bağlantılı değildir ve Obsidian tarafından onaylanmamıştır.

**İnternet gerekir mi?** Yalnızca ekip arkadaşlarını bulmak (DHT) ve yapay zekâ modelini bir kez indirmek için. Notlar, arama ve Claude erişimi çevrim dışı çalışır.

**İki kişi aynı notu düzenlerse ne olur?** Farklı bölümler otomatik olarak birleştirilir. Aynı satırlar değişirse iki sürüm de saklanır: biri notta, diğeri yanındaki `(conflito de …)` kopyasında.

**Verilerim nerede?** Vault klasörünüzde (`.md` dosyaları). Briefing'in kendi verileri `<vault>/.briefing/` (dizin, geçmiş) içinde ve kullanıcı yapılandırma klasöründedir (`%APPDATA%\Briefing`, `~/Library/Application Support/Briefing`, `~/.config/Briefing`).

## Yol haritası

- Arayüz çevirileri (i18n)
- Mobil yardımcı uygulama
- Doğrudan bağlantıları engelleyen ağlar için isteğe bağlı aktarıcı (relay)
- Üye bazında izinler ve ekip anahtarının yenilenmesi
- İmzalı ve noter onaylı kurulum dosyaları

## Katkıda bulunma

Issue ve pull request'lere açığız. Kurulum, testler ve proje yapısı için **[CONTRIBUTING.md](../../CONTRIBUTING.md)** dosyasına bakın.

## Lisans

[MIT](../../LICENSE) © 2026 Renan Kelm
