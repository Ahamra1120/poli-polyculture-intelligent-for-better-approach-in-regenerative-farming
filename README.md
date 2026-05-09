# AgriDash - IoT Dashboard Pertanian

AgriDash adalah platform dashboard IoT cerdas yang dirancang khusus untuk memantau kondisi pertanian dan lahan secara *real-time*. Proyek ini menyediakan visualisasi data yang responsif dan interaktif untuk membantu petani mengambil keputusan yang lebih baik berdasarkan data lingkungan.

## Fitur Utama

- **Pemantauan Real-time**: Menampilkan metrik penting seperti Temperatur Udara, Kelembaban Udara, Kelembaban Tanah, dan pH Tanah menggunakan *gauge chart* (ECharts) yang diperbarui secara langsung.
- **Grafik Historis**: Menyediakan grafik garis untuk melihat tren historis fluktuasi temperatur dan kelembaban.
- **Dukungan Multi-Perangkat**: Kemampuan untuk beralih antara berbagai lokasi lahan (misal: Greenhouse 1, Lahan A, Kebun B) dengan data yang menyesuaikan secara dinamis.
- **Analisis & Rekomendasi Pintar**: Memberikan prediksi cuaca dan rekomendasi pemupukan berdasarkan data sensor yang terkumpul.
- **Pengaturan & Notifikasi**: Menyediakan kontrol personalisasi profil dan manajemen preferensi notifikasi peringatan dini (contoh: Suhu Ekstrem, Kelembaban Kritis).
- **Single Page Application (SPA)**: Navigasi cepat dan responsif antar menu Dashboard, Analisis, dan Pengaturan tanpa memuat ulang (reload) halaman.
- **Koneksi MQTT**: Terhubung dengan *broker* MQTT (`broker.emqx.io`) untuk penerimaan data sensor secara efisien dengan ukuran yang ringan.

## Teknologi yang Digunakan

- **Frontend Core**: HTML5, CSS3, dan Vanilla JavaScript.
- **Visualisasi Data**: [Apache ECharts](https://echarts.apache.org/) untuk *gauge* interaktif dan grafik garis yang responsif.
- **Protokol Komunikasi**: [MQTT.js](https://github.com/mqttjs/MQTT.js) menggunakan WebSocket untuk berlangganan *topic* sensor secara *real-time*.
- **Desain & UI/UX**: Font dari Google Fonts (DM Sans & DM Mono) dan ikon dari [Phosphor Icons](https://phosphoricons.com/).

## Cara Menjalankan Proyek

1. **Unduh atau Clone Repositori**:
   Pastikan Anda mengunduh semua file di dalam direktori ini (`index.html`, `style.css`, `app.js`, dll).

2. **Jalankan Secara Lokal**:
   Cukup buka file `index.html` menggunakan browser modern (seperti Google Chrome, Mozilla Firefox, atau Microsoft Edge). 
   
   *Catatan: Anda mungkin memerlukan **Live Server** (ekstensi VS Code) atau server lokal statis lainnya agar fitur-fitur seperti modul JS atau beberapa komponen dapat dimuat dengan sempurna tanpa dibatasi oleh aturan CORS.*

3. **Simulasi Data**:
   Aplikasi sudah dilengkapi dengan *mock publisher* bawaan yang mensimulasikan data sensor secara acak dan mempublikasikannya melalui MQTT sehingga Anda dapat melihat data bergerak di grafik.

## Struktur Navigasi (Single Page)
Berkat penggabungan seluruh fitur ke dalam `index.html`, kini navigasi antarmenu dikelola oleh satu file.
- **Dashboard**: Panel utama pemantauan sensor.
- **Analisis**: Halaman riwayat data mendalam dan rekomendasi.
- **Pengaturan**: Pusat kustomisasi akun pengguna dan notifikasi.

## Lisensi
Proyek ini dibuat untuk keperluan *hackathon* dan *prototype*.
