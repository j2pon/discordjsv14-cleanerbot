# Discord Server Cleaner Bot

# Botu istediğiniz gibi kullanabilirsiniz iyi günler.

Discord.js v14 ile yazılmış, Ana sunucu üzerinden belirtilen sunucudaki rolleri ve odaları temizleyen bot.

## ⚠️ UYARI

Bu bot güçlü temizleme işlemleri yapar ve **GERİ ALINAMAZ**! Kullanmadan önce emin olun.

## 🚀 Kurulum

1. **Gereksinimler:**
   - Node.js v16.9.0 veya üzeri
   - Discord Bot Token
   - Bot sahibi Discord kullanıcı ID'si

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Konfigürasyon:**
   - `config.js` dosyasındaki değerleri doldurun:
     ```javascript
     module.exports = {
         token: 'your_bot_token_here',
         ownerId: 'your_discord_user_id_here',
         targetServerId: 'YOUR_SERVER_ID_HERE', // Komutların çalışacağı sunucu ID'si
         prefix: '!',
         cooldown: 5000
     };
     ```

4. **Botu başlatın:**
   ```bash
   npm start
   ```

## 🤖 Bot Kurulumu

1. [Discord Developer Portal](https://discord.com/developers/applications) üzerinden yeni bir uygulama oluşturun
2. "Bot" sekmesine gidin ve bot oluşturun
3. Bot token'ını kopyalayın
4. "OAuth2 > URL Generator" sekmesine gidin:
   - Scopes: `bot`
   - Bot Permissions: `Administrator` (veya gerekli izinler)
5. Oluşturulan URL ile botu sunucunuza ekleyin

## 📋 Komutlar

Tüm komutlar sadece belirlediğiniz sunucuda çalışır:

- `!help` - Yardım menüsünü gösterir
- `!servers` - Botun bulunduğu sunucuları listeler ve seçim yapar
- `!nuke` - Sunucu seçerek **NÜKLEER SALDIRI** yapar (roller, odalar, üyeler)
- `!clean` - Sunucu seçerek tüm rolleri ve odaları temizler
- `!cleanroles` - Sunucu seçerek sadece rolleri temizler
- `!cleanchannels` - Sunucu seçerek sadece odaları temizler
- `!status` - Sunucu seçerek durumu gösterir

### 🔄 Kullanım Şekli:

**Yöntem 1 - Sunucu Seçimi:**
1. `!servers` yazarak sunucuları listele
2. Numarayı yazarak sunucu seç (örn: `1`, `2`, `3`)
3. `!nuke` yazarak seçilen sunucuyu temizle

**Yöntem 2 - Direkt ID:**
- `!nuke <sunucu_id>` şeklinde direkt sunucu ID'si ile kullan

### 🎯 Önemli Not:
- Komutlar sadece `config.js` dosyasında belirlediğiniz sunucu ID'sinde çalışır
- Diğer sunucularda komutlar çalışmaz

## 🔒 Güvenlik

- Sadece bot sahibi (config.js'deki ownerId) komutları kullanabilir
- Her komut için 5 saniye cooldown vardır
- Kritik işlemler için onay istenir
- Rate limit koruması vardır

## ⚙️ Özellikler

- **💥 NÜKLEER SALDIRI:** Tek komut ile tüm sunucuyu yok eder (roller, odalar, üyeler)
- **🏠 Sunucu Seçim Sistemi:** Botun bulunduğu sunucuları listeler ve kolay seçim
- **🛡️ Güçlü Hata Yönetimi:** Bot asla kapanmaz, hataları atlar ve devam eder
- **⚡ Akıllı Temizleme:** Yapılamayan işlemleri atlar, yapılabilecekleri yapar
- **🔒 Güvenli Temizleme:** Bot'un silebileceği rolleri ve kanalları tespit eder
- **📊 Detaylı Raporlama:** İşlem sonuçları ve hatalar hakkında bilgi
- **⏱️ Rate Limit Koruması:** Discord API limitlerini aşmamak için gecikme
- **✅ Onay Sistemi:** Kritik işlemler için kullanıcı onayı
- **🔄 Otomatik Yeniden Bağlanma:** Bağlantı kesilirse otomatik yeniden bağlanır
- **🎯 İki Kullanım Şekli:** Sunucu seçimi veya direkt ID ile kullanım

## 🛠️ Geliştirme

```bash
# Geliştirme modunda çalıştır (otomatik yeniden başlatma)
npm run dev
```

## 📝 Notlar

### Sunucu Seçim Sistemi:
- `!servers` komutu ile botun bulunduğu tüm sunucular listelenir
- Sunucu numarasını yazarak seçim yapabilirsiniz
- Seçilen sunucu otomatik olarak diğer komutlarda kullanılır
- 60 saniye içinde seçim yapmazsanız işlem iptal olur

### Nuke Komutu (`!nuke`):
- TÜM üyeleri banlar (bot ve sunucu sahibi hariç)
- TÜM rolleri siler (@everyone hariç)
- TÜM kanalları siler
- Hata yapmadan çalışır, yapılamayanları atlar

### Diğer Komutlar:
- Bot, @everyone rolünü silmez
- Bot'un silebileceği rolleri ve kanalları tespit eder
- Her silme işlemi arasında 1-2 saniye bekleme vardır
- Hata olsa bile bot kapanmaz, devam eder

### Kullanım Örnekleri:
```
!servers          # Sunucuları listele
1                 # 1 numaralı sunucuyu seç
!nuke             # Seçilen sunucuyu nuke et

# Veya direkt ID ile:
!nuke 123456789   # Direkt sunucu ID'si ile nuke et
```

## ⚠️ Sorumluluk

Bu botu kullanırken oluşabilecek herhangi bir zarardan kullanıcı sorumludur. Bot sahibi olarak, botun kullanımından tamamen sorumlusunuz.

## 📄 Lisans

MIT License
