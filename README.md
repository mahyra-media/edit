# Bunga di Balik Kaca — Studio Shorts 3D

Studio web (Vite + React Three Fiber) untuk memproduksi YouTube Shorts drama sekolah anime.
Naskah ditulis sebagai data, lalu studio mengubahnya jadi video 1080×1920 lengkap dengan kamera otomatis, bubble dialog, suara, dan lip-sync.

> Siswi miskin penerima beasiswa masuk SMA elit, dibully ratu sekolah — tapi tak ada yang tahu sekolah itu didirikan ibunya yang hilang 10 tahun lalu.

## Mulai

Butuh Node.js 18 atau lebih baru.

```bash
npm install
npm run dev        # buka http://localhost:5173
npm run check      # cek naskah terhadap formula Shorts
npm run naskah     # tulis ulang docs/naskah-episode.md
```

Studio langsung bisa diputar tanpa aset apa pun: karakter tampil sebagai boneka placeholder, gerakan memakai pose bawaan, dan mulut bergerak mengikuti perkiraan panjang dialog. Setiap aset yang kamu tambahkan otomatis menggantikan versi cadangannya.

## Alur produksi satu episode

1. **Naskah** — edit `src/episodes/epXX.js`. Halaman ter-update otomatis, panel kanan menunjukkan apakah formula lolos.
2. **Suara** — buka tab **🎙 Suara** di studio dan rekam tiap dialog langsung pakai mikrofon. Durasi shot menyesuaikan panjang suara dan mulut karakter mengikuti suara asli. Klik **Unduh semua suara (ZIP)** lalu ekstrak ke folder project supaya permanen.
3. **Preview** — Spasi untuk putar, ← → untuk loncat shot, klik daftar shot untuk langsung ke adegan tertentu.
4. **Rekam** — tombol "Rekam episode" memutar dari awal dan menyimpan video + audio. Chrome/Edge biasanya menghasilkan MP4; browser lain WebM (bisa dikonversi dengan HandBrake atau `ffmpeg -i in.webm -c:v libx264 -c:a aac out.mp4`).
5. **Upload** — judul ada di field `judulUpload` tiap episode.

Tips perekaman: biarkan tab tetap terlihat dan jangan pindah jendela selama merekam, karena browser memperlambat tab yang tidak aktif. Kalau hasil patah-patah, rekam layar dengan OBS (Window Capture) sebagai alternatif.

## Struktur

```
src/
  episodes/     naskah Ep 1–5 (data) + index.js
  data/         karakter, lokasi & titik posisi, daftar animasi & ekspresi
  engine/       build (timeline), validate (formula), camera, audio, recorder, vrm, mixamo
  scene/        Studio (panggung), Character, Locations, Effects, Props
  overlay/      teks di layar: hook, bubble, caption, pop, PART 2?
  ui/           panel kontrol
public/
  models/       <id>.vrm dari VRoid Studio
  anims/        <nama>.fbx dari Mixamo      (tidak ikut di-commit)
  audio/        epXX/, sfx/, bgm/           (bgm tidak ikut di-commit)
docs/
  naskah-episode.md   naskah baca + daftar rekaman
  panduan-aset.md     cara menyiapkan karakter, animasi, suara, musik
```

## Format naskah (ringkas)

```js
{
  d: 3.6,                    // durasi shot (detik)
  beat: 'twist',             // hook | konflik | eskalasi | twist | cliff
  loc: 'lorong',             // id dari src/data/locations.js
  cam: { s: 'close', on: 'ren', m: 'push' },
  cast: {
    ren:  { at: 'B', to: [0.2, -1.4], face: 'hana', anim: 'walk', expr: 'cold' },
    hana: { at: [0.1, 0.4], face: 'ren', anim: 'floorsit', expr: 'surprised' },
  },
  lines: [{ who: 'ren', text: 'Kau. Berdiri.', note: 'arahan untuk pengisi suara' }],
  hook: 'TEKS BESAR', caption: 'narasi kecil', pop: 'BRUK!', end: true,
  fx: ['shake', 'flash', 'vignette', 'sepia', 'zoom', 'petals', 'rain', 'dust', 'dark'],
  sfx: [{ src: 'audio/sfx/langkah.mp3', at: 0.2 }],
  props: [{ p: 'key', at: [x, y, z], to: [x, y, z], spin: true }],
}
```

Jenis kamera: `wide medium close xclose ots low high insert free`. Gerak: `push pull pan orbit rise tilt handheld drift`. Opsi tambahan: `angle` (derajat memutari subjek), `dist`, `amt` (kekuatan gerak), `from` (untuk ots), `point` & `off` (untuk insert).

Opsi pemeran: `face` bisa angka derajat (0 = menghadap kamera default), `'cam'`, atau id karakter lain. `silhouette: true` membuat karakter hitam (identitas dirahasiakan), `flashlight: true` menyalakan senter HP. Dialog bisa `vo: true` (suara kenangan tanpa bubble) atau `hideName: true` (nama tampil "???").

Posisi kamera awal dibuat otomatis; kalau framing kurang pas, atur `angle`, `dist`, atau `amt` di shot itu.

## Simpan di GitHub

**Cara paling mudah: GitHub Desktop** (tanpa perintah, semua file & folder sekaligus).

1. Install GitHub Desktop, login, lalu *File → Clone repository* → pilih repo ini.
2. Salin/ekstrak file project ke folder hasil clone (timpa file lama).
3. GitHub Desktop otomatis menampilkan semua perubahan. Isi ringkasan di kiri bawah → **Commit to main** → **Push origin**.

Alternatif lewat terminal:

Buat repository **private** (animasi Mixamo dan musik berlisensi tidak boleh dibagikan ulang, walau sudah di-ignore).

```bash
git init
git add .
git commit -m "Studio Bunga di Balik Kaca: setup + naskah Ep 1-5"
git branch -M main
git remote add origin https://github.com/<username>/bunga-di-balik-kaca.git
git push -u origin main
```

Atau dengan GitHub CLI: `gh repo create bunga-di-balik-kaca --private --source=. --push`.

## Aturan monetisasi (checklist tiap episode)

- Semua karakter buatan sendiri di VRoid, lokasi buatan sendiri, tanpa gameplay atau aset game mana pun.
- Animasi Mixamo boleh dipakai di video; file FBX mentahnya jangan dibagikan.
- Musik & SFX dari sumber berlisensi (Pixabay, Uppbeat, dll.) — simpan bukti lisensi.
- Setiap episode punya naskah, dialog, dan susunan adegan baru; voice over sendiri.
- Jangan pakai nama game lain di judul, deskripsi, atau tag.
- Bullying ditampilkan tanpa kekerasan eksplisit; hubungan antar tokoh pelajar tetap wajar (tanpa romansa berlebihan).
- Set audiens video sesuai target yang sebenarnya.

## Panel koreksi (untuk merapikan framing)

Di bawah tombol putar ada **Koreksi shot**, yang selalu mengikuti shot yang sedang tampil:

- Slider jarak, putar, tinggi, dan lebar lensa. Perubahan langsung terlihat dan ikut terekam.
- Tombol label masalah (terlalu dekat, teks ketutup, dll.) plus kolom catatan.
- **📸 Simpan gambar frame** untuk screenshot 1080×1920.
- **Salin semua koreksi** menyalin ringkasan + JSON. Tempel ke chat supaya koreksinya dimasukkan permanen ke naskah.

Koreksi tersimpan di browser (localStorage), jadi tidak hilang saat halaman dimuat ulang. Centang **zona aman Shorts** untuk melihat area yang nanti tertutup tombol dan judul YouTube (garis ini tidak ikut terekam).
