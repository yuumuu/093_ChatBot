# PWS Chatbot Workspace (Pertemuan 10)

Aplikasi chatbot web berbasis Node.js dan Express yang terintegrasi dengan OpenRouter API. Aplikasi ini menggunakan mekanisme Server-Sent Events (SSE) untuk streaming respons secara real-time, dilengkapi tata letak Split Workspace (area percakapan dan catatan sesi), serta sistem auto-fallback model gratis.

---

## Pratinjau Aplikasi

### Tampilan Antarmuka Workspace
![Tampilan Antarmuka Chatbot](<docs/images/PWS Chatbot Workspace.png>)

### Status Deployment
![Ringkasan Deployment Vercel](<docs/images/Overview – Vercel.png>)

---

## Fitur Utama

* **Streaming Real-Time (SSE)**: Respons dari model AI ditampilkan per token tanpa jeda tunggu lama.
* **Multi-Model Auto-Fallback**: Server otomatis berpindah ke model alternatif gratis jika model utama mengalami antrean kuota atau rate-limit upstream.
* **Split Workspace**: Kolom percakapan di sisi kiri dan kolom catatan kerja (scratchpad) di sisi kanan yang tersimpan di localStorage.
* **Dual Mode (Light & Dark)**: Mode tampilan terang dan gelap yang dapat dialihkan kapan saja dengan kontras tinggi.
* **Blok Kode & Catatan**: Pemformatan sintaks kode otomatis dengan tombol salin dan tombol simpan langsung ke catatan.
* **Desain Minimalis**: Antarmuka bersih tanpa ornamen dekoratif yang berlebihan, responsif dari layar ponsel hingga desktop.

---

## Struktur Direktori

```text
pertemuan-10/
├── docs/
│   └── images/
│       ├── Overview – Vercel.png
│       └── PWS Chatbot Workspace.png
├── public/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── .env.example
├── package.json
├── README.md
└── server.js
```

---

## Panduan Menjalankan Aplikasi

### 1. Prasyarat
Pastikan komputer Anda sudah terpasang Node.js (versi 18 atau yang lebih baru).

### 2. Instalasi Dependensi
Clone atau unduh repositori ini, lalu jalankan perintah:
```bash
npm install
```

### 3. Konfigurasi Lingkungan (.env)
Buat file `.env` di root direktori proyek, lalu isi kunci API OpenRouter Anda:
```env
OPENROUTER_API_KEY=kunci_api_openrouter_anda
```

### 4. Menjalankan Server
Jalankan server aplikasi:
```bash
npm start
```
Buka browser dan akses alamat:
```
http://localhost:3000
```
