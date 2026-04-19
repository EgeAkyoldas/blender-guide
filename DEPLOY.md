# 🚀 Netlify'a Deploy Rehberi

Bu proje Netlify'da hazır çalışır. API anahtarı **serverless function** içinde kalır, tarayıcıya asla düşmez.

---

## 📁 Proje Yapısı

```
.
├── index.html                   # Ana sayfa (tüm UI + chat widget)
├── persona.yaml                 # AI kişiliği — buradan düzenle
├── netlify.toml                 # Netlify konfigürasyonu
├── .env.example                 # Env var şablonu
├── .gitignore                   # Secrets koruması
├── DEPLOY.md                    # Bu dosya
└── netlify/functions/
    ├── chat.mjs                 # Gemini proxy
    └── package.json             # js-yaml bağımlılığı
```

---

## ⚡ Hızlı Başlangıç (3 adım)

### 1. GitHub'a yükle

```bash
git init
git add .
git commit -m "initial blender rehberi"
git remote add origin https://github.com/KULLANICIADIN/blender-rehberi.git
git push -u origin main
```

> `.gitignore` sayesinde `.env` dosyan asla yüklenmez.

### 2. Netlify'da site oluştur

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
2. GitHub'ı seç, bu repoyu seç
3. Build ayarları: hiçbir şey değiştirme (Netlify `netlify.toml`'u okuyacak)
4. **Deploy site** → 30 saniye içinde deploy olur

### 3. Environment variable ekle

1. Netlify dashboard → **Site Settings** → **Environment variables**
2. **Add a variable** butonuna tıkla:
   - Key: `GEMINI_API_KEY`
   - Value: `AIza...` (senin gerçek anahtarın)
   - Scopes: **Functions** (en önemlisi — fonksiyonda kullanılacak)
3. (Opsiyonel) `GEMINI_MODEL` ekle: `gemini-2.5-flash` (default)
4. Sağ üstten **Deploys** → **Trigger deploy** → **Deploy site** ile yeniden deploy et

Bitti. Siten canlı ve chat çalışıyor. ✅

---

## 🔑 Gemini API Anahtarı Alma

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) aç
2. **Create API key** → projeyi seç (veya yeni oluştur)
3. Kopyala → Netlify env var'a yapıştır

**Free tier limitleri (2026 itibariyle):** `gemini-2.5-flash` için bol kotayla başlar. Eğer limitler değişirse dokümantasyondan kontrol et.

---

## 🧪 Yerel Test (İsteğe Bağlı)

Yerelde çalıştırmak istersen:

```bash
# 1. Netlify CLI kur
npm install -g netlify-cli

# 2. Function dependency'lerini kur
cd netlify/functions
npm install
cd ../..

# 3. .env dosyasını oluştur
cp .env.example .env
# .env içine kendi GEMINI_API_KEY'ini yaz

# 4. Local dev sunucusunu başlat
netlify dev
```

`http://localhost:8888` açılır. `/api/chat` endpoint'i otomatik olarak function'a yönlendirilir.

> `file://` ile direkt açarsan chat çalışmaz — function gerektiriyor. `netlify dev` şart.

---

## 🧠 Persona Düzenleme

`persona.yaml` dosyası AI'ın kişiliğini tanımlar. Düzenle, commit et, push et — Netlify otomatik yeniden deploy eder ve yeni persona devreye girer.

### Düzenlenebilir bölümler:

| Bölüm | Ne kontrol eder |
|-------|-----------------|
| `identity` | AI'ın adı ve rolü |
| `voice` | Ton, yoğunluk, tempo |
| `core_principles` | Temel davranış kuralları |
| `never_do` | Kesinlikle yapmaması gerekenler |
| `always_do` | Daima uyması gerekenler |
| `response_structure` | Yanıt biçimi şablonları |
| `navigation_actions` | Site içi yönlendirme aksiyonları |
| `tone_examples` | Few-shot öğrenme için örnekler |
| `fallback_strategies` | Bilinmeyen/zor durumlar |

### Örnekler tonu en çok etkiler

`tone_examples` bölümüne eklediğin her `good_response` örneği AI'ın ton kalıbını oturtur. Kötü örnek (`bad_response`) ekleyebilirsin — AI onu antipattern olarak öğrenir.

---

## 🛡️ Güvenlik

**✅ Güvende olan:**
- API anahtarı server-side (`process.env.GEMINI_API_KEY`). Client asla görmez.
- `.env` dosyası `.gitignore`'da.
- HTTP referrer kısıtlaması Google Cloud Console'dan eklenebilir (extra koruma).

**⚠️ Düşünmen gereken:**
- Fonksiyon endpoint'i public. Siteni ziyaret eden herkes chat'i kullanabilir → Gemini kotandan tüketir.
- Kötü niyetli biri `/api/chat`'e script'le sürekli istek atabilir.
- Koruma için seçenekler:
  - Netlify'ın edge rate limiting'i (paid plan)
  - Cloudflare önünde rate limit
  - Fonksiyona basit IP-based throttle (KV storage gerekli)
  - Client-side Turnstile/reCAPTCHA doğrulaması
- **Bütçe için:** Google Cloud Console → Billing → Budget alerts kur. Kotayı limitlemek daha güvenli.

---

## 🐛 Sorun Giderme

| Belirti | Çözüm |
|---------|-------|
| Chat'e yazıyorum, "Hata: GEMINI_API_KEY ayarlı değil" | Netlify env var'ı ekle, redeploy et |
| Function 404 veriyor | `netlify.toml` repo root'unda mı? Netlify build log'una bak |
| Yanıt gelmiyor (404 /api/chat) | `netlify/functions/` klasörü doğru mu? `chat.mjs` içindeki `config.path` set mi? |
| "Boş yanıt (SAFETY)" | Gemini safety filter'ı devreye girmiş. Soruyu yeniden ifade et |
| "Boş yanıt (MAX_TOKENS)" | `maxOutputTokens: 1024`'ü chat.mjs'de artır |
| persona.yaml değişikliği yansımıyor | Function cache'i var. Redeploy veya function URL'ini değiştir |
| Lokal `netlify dev` port 8888'i kullanmıyor | `netlify.toml`'a `[dev] port = 8888` ekle |

Logları görmek için: Netlify dashboard → **Functions** sekmesi → `chat` → logs.

---

## 🎨 Özelleştirme İpuçları

- **Başka dil desteği**: `persona.yaml` içinde `voice.language` değiştir
- **Farklı model**: env var `GEMINI_MODEL=gemini-2.5-pro` (pro daha akıllı ama yavaş/pahalı)
- **Temperature**: `chat.mjs` içinde `generationConfig.temperature` (0.3 = katı, 0.9 = yaratıcı)
- **Yeni aksiyon ekle**: Hem `persona.yaml` içindeki `navigation_actions.types`'a hem de `index.html`'deki `executeActions()` fonksiyonuna ekle

---

Deploy'un hayırlı olsun. 🎨✨
