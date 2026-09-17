# Panduan Aset

Semua aset bersifat opsional: studio tetap berjalan dengan cadangan. Tambahkan bertahap, mulai dari Hana dan Mira.

## 1. Karakter (VRoid Studio)

1. Buat karakter di VRoid Studio (gratis, Windows/Mac) sesuai konsep: Hana rambut gelap + pita biru, Mira pirang, Ren rambut hitam rapi, Kaito rambut abu-abu, dst.
2. Seragam: desain seragam Akademi Seiran sendiri (jas navy + aksen), jangan meniru seragam dari game atau anime lain.
3. **Export → VRM** (VRM 1.0 atau 0.x sama-sama didukung). Kurangi poligon di dialog export supaya ringan.
4. Simpan dengan nama persis seperti tabel. Muat ulang halaman; chip karakter di panel berubah dari "boneka" menjadi "VRM".

Pakai file **.vrm langsung**, jangan dikonversi ke .glb, karena data ekspresi wajah dan bentuk mulut (untuk lip-sync) tersimpan di ekstensi VRM.

| Karakter | File | Tinggi acuan |
|---|---|---|
| Hana | `public/models/hana.vrm` | 1.52 m |
| Ren | `public/models/ren.vrm` | 1.7 m |
| Mira | `public/models/mira.vrm` | 1.58 m |
| Kenta | `public/models/kenta.vrm` | 1.6 m |
| Yuki | `public/models/yuki.vrm` | 1.48 m |
| Kaito | `public/models/kaito.vrm` | 1.76 m |
| Bu Sae | `public/models/sae.vrm` | 1.62 m |
| Nenek Sumi | `public/models/sumi.vrm` | 1.45 m |
| Riko | `public/models/riko.vrm` | 1.55 m |
| Nana | `public/models/nana.vrm` | 1.54 m |
| Gorou | `public/models/gorou.vrm` | 1.75 m |
| Aoi | `public/models/aoi.vrm` | 1.6 m |

## 2. Animasi (Mixamo)

1. Login ke mixamo.com dan pakai karakter bawaannya (mis. Y Bot); tidak perlu upload karakter VRoid.
2. Cari animasi dengan kata kunci di tabel, atur parameternya, centang **In Place** kalau ada.
3. Download dengan Format **FBX Binary**, Skin **Without Skin**, 30 fps.
4. Ganti nama file sesuai tabel dan taruh di `public/anims/`.

Animasi yang belum ada otomatis diganti pose prosedural sederhana. Untuk menambah animasi baru, daftarkan di `src/data/motion.js` lalu pakai namanya di naskah.

| Nama di naskah | File | Loop | Kata kunci pencarian |
|---|---|---|---|
| `idle` | `public/anims/idle.fbx` | ya | Idle / Breathing Idle |
| `walk` | `public/anims/walk.fbx` | ya | Walking (In Place) |
| `run` | `public/anims/run.fbx` | ya | Running (In Place) |
| `talk` | `public/anims/talk.fbx` | ya | Talking |
| `sad` | `public/anims/sad.fbx` | ya | Sad Idle |
| `cry` | `public/anims/cry.fbx` | ya | Crying |
| `laugh` | `public/anims/laugh.fbx` | ya | Laughing |
| `crossarms` | `public/anims/crossarms.fbx` | ya | Standing Arms Crossed / Idle Arms Crossed |
| `angry` | `public/anims/angry.fbx` | ya | Angry |
| `surprised` | `public/anims/surprised.fbx` | tidak | Surprised / Startled |
| `scared` | `public/anims/scared.fbx` | ya | Terrified / Scared |
| `think` | `public/anims/think.fbx` | ya | Thinking |
| `point` | `public/anims/point.fbx` | tidak | Pointing |
| `phone` | `public/anims/phone.fbx` | ya | Texting / Talking On Phone |
| `carry` | `public/anims/carry.fbx` | ya | Carry / Box Walk (In Place) |
| `grab` | `public/anims/grab.fbx` | tidak | Pick Fruit / Taking Item |
| `holdup` | `public/anims/holdup.fbx` | ya | Waving (tahan tangan di atas) |
| `trip` | `public/anims/trip.fbx` | tidak | Soccer Pass / Leg Sweep |
| `fall` | `public/anims/fall.fbx` | tidak | Stumble / Falling Flat |
| `floorsit` | `public/anims/floorsit.fbx` | ya | Sitting On Ground / Sitting Idle Floor |
| `pickup` | `public/anims/pickup.fbx` | tidak | Picking Up / Kneeling Pick Up |
| `sit` | `public/anims/sit.fbx` | ya | Sitting Idle (kursi) |
| `piano` | `public/anims/piano.fbx` | ya | Playing Piano |
| `pull` | `public/anims/pull.fbx` | tidak | Pulling / Tug |
| `catch` | `public/anims/catch.fbx` | tidak | Catching |
| `give` | `public/anims/give.fbx` | tidak | Giving Item / Handing Over |
| `shy` | `public/anims/shy.fbx` | ya | Nervously Look Around / Shy |
| `lookaround` | `public/anims/lookaround.fbx` | ya | Looking Around |
| `unlock` | `public/anims/unlock.fbx` | tidak | Opening Door / Turning Key |

## 3. Suara dialog

**Cara termudah: rekam langsung di studio.** Buka tab **🎙 Suara**, klik **● Rekam** di tiap baris, ucapkan dialognya, lalu klik **■ Selesai**. Studio otomatis memotong hening, menyamakan volume, dan memanjangkan shot kalau suaranya lebih panjang dari rencana. Mulut karakter bergerak mengikuti suara asli.

- Pakai earphone dan ruangan yang tenang. Mikrofon HP/earphone biasanya lebih jernih daripada mikrofon laptop.
- Satu orang mengisi beberapa karakter? Atur **Nada suara per karakter** (mis. Mira 1.08×, Kenta 0.95×).
- Rekaman tersimpan di browser. Klik **⬇ Unduh semua suara (ZIP)**, ekstrak ke folder project (file masuk ke `public/audio/epXX/`), lalu upload ke GitHub supaya permanen.
- Merekam di aplikasi lain atau memakai TTS? Beri nama file sesuai kode baris (`L03_mira.mp3`) lalu pakai **📂 Impor banyak file**. Pastikan lisensi TTS mengizinkan penggunaan komersial.
- Daftar kode baris per karakter ada di `docs/naskah-episode.md`.

## 4. Musik & efek suara

BGM per episode (volume diatur `bgmVolume`, default 0.22, otomatis fade-out di akhir):

- `public/audio/bgm/ep01.mp3`
- `public/audio/bgm/ep02.mp3`
- `public/audio/bgm/ep03.mp3`
- `public/audio/bgm/ep04.mp3`
- `public/audio/bgm/ep05.mp3`

SFX yang dipakai naskah Ep 1–5:

- `public/audio/sfx/loker-buka.mp3`
- `public/audio/sfx/kain-sobek.mp3`
- `public/audio/sfx/jatuh.mp3`
- `public/audio/sfx/langkah.mp3`
- `public/audio/sfx/whoosh.mp3`
- `public/audio/sfx/angin.mp3`
- `public/audio/sfx/angin-kencang.mp3`
- `public/audio/sfx/buku-jatuh.mp3`
- `public/audio/sfx/jangkrik.mp3`
- `public/audio/sfx/logam-jatuh.mp3`
- `public/audio/sfx/klik.mp3`
- `public/audio/sfx/pintu-berderit.mp3`
- `public/audio/sfx/tetesan-air.mp3`
- `public/audio/sfx/kain.mp3`
- `public/audio/sfx/piano-nada.mp3`
- `public/audio/sfx/piano-melodi.mp3`

Sumber yang umum dipakai: Pixabay (musik & SFX) dan Uppbeat (musik). Baca lisensinya dan simpan bukti unduhan untuk tiap file.

## 5. Lokasi

Lokasi saat ini berupa blockout dari bentuk dasar di `src/scene/Locations.jsx`. Untuk visual lebih bagus, modelkan sendiri di Blender (atau pakai aset 3D berlisensi komersial), export `.glb`, lalu render di komponen lokasi terkait. Pertahankan skala 1 unit = 1 meter dan titik posisi di `src/data/locations.js`.
