# ManhwaKu 🏰❄️

ManhwaKu adalah platform baca manhwa online modern yang dibangun dengan teknologi web terbaru. Website ini menawarkan pengalaman membaca yang nyaman dengan antarmuka yang responsif, mode gelap premium, dan fitur interaktif.

![ManhwaKu Preview](https://manhwaku.biz.id)

## ✨ Fitur Utama

- **🎨 Modern Dark UI**: Desain antarmuka gelap premium yang nyaman di mata untuk sesi membaca yang panjang.
- **❄️ Efek Salju**: Animasi salju interaktif yang memberikan suasana estetik (Global effect).
- **📱 Responsif Penuh**: Tampilan yang optimal di semua perangkat (Desktop, Tablet, Mobile).
- **🔍 Pencarian Cepat**: Fitur pencarian manhwa dan filtering chapter yang efisien.
- **📚 Library & Riwayat**:
  - Menyimpan riwayat bacaan secara otomatis.
  - Penanda chapter terakhir yang dibaca.
- **⚡ Performa Tinggi**: Dibangun menggunakan Next.js App Router untuk performa dan SEO maksimal.
- **🎢 Hero Slider**: Rekomendasi manhwa acak di halaman utama untuk menemukan bacaan baru.

## 🛠️ Teknologi yang Digunakan

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks (useState, useEffect, Context)
- **Analytics**: Google Tag Manager & GA4
- **Monetization**: Adsterra / Custom Ad Components

## 🚀 Cara Menjalankan Project

Ikuti langkah-langkah berikut untuk menjalankan project ini di komputer lokal Anda:

### Prasyarat

- Node.js (versi 18 ke atas direkomendasikan)
- npm atau yarn

### Instalasi

1. **Clone repository**

   ```bash
   git clone https://github.com/username/manhwaku.git
   cd manhwaku
   ```

2. **Install dependencies**

   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Jalankan server development**

   ```bash
   npm run dev
   # atau
   yarn dev
   ```

4. **Buka browser**
   Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

## 📂 Struktur Project

```
manhwaku/
├── app/                  # Halaman dan rute aplikasi (App Router)
│   ├── detail/           # Halaman detail manhwa
│   ├── jelajahi/         # Halaman eksplorasi
│   ├── library/          # Halaman library/riwayat
│   ├── read/             # Halaman baca chapter
│   └── ...
├── components/           # Komponen UI yang dapat digunakan kembali
│   ├── Ads/              # Komponen iklan
│   ├── home/             # Komponen khusus halaman utama
│   └── ui/               # Komponen UI umum (Navbar, Pagination, SnowEffect, dll)
├── constants/            # Konstanta aplikasi
├── hooks/                # Custom React Hooks
├── lib/                  # Utility functions
├── public/               # Aset statis (gambar, icon)
└── types/                # Definisi tipe TypeScript
```

## 📝 Catatan Pengembang

- Project ini mendukung integrasi dengan iklan banner dan native.
- Konfigurasi SEO dan Analytics terdapat di `app/layout.tsx`.
- Data manhwa saat ini diambil menggunakan internal API routes.

## 📄 Lisensi

[MIT License](LICENSE)
