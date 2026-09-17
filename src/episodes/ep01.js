// EPISODE 1 — "Sepatu Robek"
// Format shot:
//   d      durasi (detik)          loc   id lokasi (src/data/locations.js)
//   beat   hook|konflik|eskalasi|twist|cliff
//   cam    { s: jenis, on: subjek, from: (ots), m: gerak, amt, angle, dist, point, off }
//   cast   { id: { at, to, face, anim, expr, silhouette } }
//   lines  [{ who, text, note, hideName, vo }]   (maks 8 kata)
//   hook / caption / pop / end / fx / sfx / props
export default {
  id: 'ep01',
  no: 1,
  title: 'Sepatu Robek',
  judulUpload: 'Anak beasiswa dibully di hari pertama 😢 #1',
  bgm: 'audio/bgm/ep01.mp3',
  shots: [
    {
      d: 2.2, beat: 'hook', loc: 'jalan_sakura', fx: ['petals'],
      cam: { s: 'wide', angle: 0, m: 'push', amt: 1.5 },
      cast: { hana: { at: [0, 2.2], to: [0, 0.6], face: 180, anim: 'walk', expr: 'smile' } },
      hook: 'HARI PERTAMA DI SEKOLAH ORANG KAYA',
    },
    {
      d: 3.6, beat: 'konflik', loc: 'genkan',
      cam: { s: 'medium', on: 'hana', angle: 50, m: 'push' },
      cast: { hana: { at: 'loker', face: -90, anim: 'unlock', expr: 'smile' } },
      lines: [{ who: 'hana', text: 'Akhirnya... Akademi Seiran.', note: 'pelan, kagum' }],
      sfx: [{ src: 'audio/sfx/loker-buka.mp3', at: 2.4 }],
    },
    {
      d: 3.8, loc: 'genkan', fx: ['zoom'],
      cam: { s: 'insert', point: [-2.0, 1.05, -0.4], off: [0.55, 0.1, 0.25], m: 'push', amt: 1.2 },
      cast: { hana: { at: 'loker', face: -90, anim: 'surprised', expr: 'surprised' } },
      props: [{ p: 'shoes', at: [-2.0, 1.0, -0.4], torn: true }],
      pop: 'KREK!',
      lines: [{ who: 'hana', text: 'Sepatuku... kenapa robek begini?', note: 'kaget, suara bergetar' }],
      sfx: [{ src: 'audio/sfx/kain-sobek.mp3', at: 0.1 }],
    },
    {
      d: 4.0, beat: 'eskalasi', loc: 'genkan',
      cam: { s: 'ots', on: 'mira', from: 'hana', m: 'push' },
      cast: {
        hana: { at: 'loker', face: 'mira', anim: 'surprised', expr: 'sad' },
        mira: { at: 'B', face: 'hana', anim: 'crossarms', expr: 'smirk' },
        riko: { at: 'C', face: 'hana', anim: 'laugh', expr: 'happy' },
        nana: { at: 'D', face: 'hana', anim: 'laugh', expr: 'happy' },
      },
      lines: [
        { who: 'mira', text: 'Sepatu murah memang gampang rusak.', note: 'manis tapi menusuk' },
        { who: 'riko', text: 'Hihihi!' },
      ],
    },
    {
      d: 3.6, loc: 'genkan',
      cam: { s: 'close', on: 'hana', m: 'push' },
      cast: {
        hana: { at: 'loker', face: 'mira', anim: 'sad', expr: 'sad' },
        mira: { at: 'B', face: 'hana', anim: 'crossarms', expr: 'smirk' },
      },
      lines: [{ who: 'hana', text: 'Ini hadiah dari nenekku.', note: 'menahan tangis' }],
    },
    {
      d: 3.8, loc: 'genkan',
      cam: { s: 'close', on: 'mira', m: 'push', amt: 1.3 },
      cast: {
        hana: { at: 'loker', face: 'mira', anim: 'sad', expr: 'sad' },
        mira: { at: 'B', face: 'hana', anim: 'crossarms', expr: 'smirk' },
      },
      lines: [{ who: 'mira', text: 'Anak beasiswa, jangan belagu di sini.', note: 'dingin' }],
    },
    {
      d: 4.2, loc: 'lorong',
      cam: { s: 'wide', angle: 0, m: 'pull' },
      cast: {
        hana: { at: 'B', to: 'A', face: 0, anim: 'walk', expr: 'sad' },
        nana: { at: 'D', face: 'hana', anim: 'point', expr: 'smirk' },
        riko: { at: 'E', face: 'hana', anim: 'laugh', expr: 'happy' },
      },
      caption: 'Semua mata tertuju padanya...',
      lines: [{ who: 'nana', text: 'Lihat, sepatunya diikat tali rafia.', note: 'berbisik keras' }],
    },
    {
      d: 3.4, loc: 'lorong',
      cam: { s: 'low', on: 'mira', m: 'push', amt: 1.4 },
      cast: {
        hana: { at: [0, -0.8], to: [0.1, 0.2], face: 0, anim: 'walk', expr: 'sad' },
        mira: { at: 'E', face: -90, anim: 'trip', expr: 'smirk' },
      },
      lines: [{ who: 'mira', text: 'Ups. Kakiku licin.', note: 'pura-pura polos' }],
    },
    {
      d: 2.6, loc: 'lorong', fx: ['shake', 'flash'],
      cam: { s: 'medium', on: 'hana', m: 'handheld', amt: 1.5 },
      cast: {
        hana: { at: [0.1, 0.4], face: 0, anim: 'fall', expr: 'surprised' },
        mira: { at: 'E', face: -90, anim: 'crossarms', expr: 'smirk' },
      },
      pop: 'BRUK!',
      sfx: [{ src: 'audio/sfx/jatuh.mp3', at: 0.15 }],
    },
    {
      d: 3.8, loc: 'lorong',
      cam: { s: 'high', on: 'hana', m: 'rise' },
      cast: {
        hana: { at: [0.1, 0.4], face: 0, anim: 'floorsit', expr: 'sad' },
        mira: { at: 'E', face: 'hana', anim: 'crossarms', expr: 'smirk' },
      },
      props: [{ p: 'papers', at: [0.2, 0.01, 0.9] }],
      lines: [{ who: 'mira', text: 'Sekolah ini bukan untukmu, Aozora.', note: 'dari atas, merendahkan' }],
    },
    {
      d: 4.0, loc: 'lorong', fx: ['vignette'],
      cam: { s: 'xclose', on: 'hana', m: 'push' },
      cast: { hana: { at: [0.1, 0.4], face: 20, anim: 'floorsit', expr: 'angry' } },
      caption: '(berbisik)',
      lines: [{ who: 'hana', text: 'Ibu... aku harus bertahan.', note: 'bisikan, tangan memegang pita' }],
    },
    {
      d: 4.8, beat: 'twist', loc: 'lorong',
      cam: { s: 'wide', angle: 180, m: 'pull', dist: 4.5 },
      cast: {
        ren: { at: 'B', to: [0.2, -1.4], face: 0, anim: 'walk', expr: 'cold' },
        mira: { at: 'E', face: 'ren', anim: 'surprised', expr: 'surprised' },
        hana: { at: [0.1, 0.4], face: 180, anim: 'floorsit', expr: 'surprised' },
      },
      hook: 'KETUA OSIS DATANG',
      lines: [{ who: 'ren', text: 'Lorong ini bukan tempat bermain.', note: 'datar, berwibawa' }],
      sfx: [{ src: 'audio/sfx/langkah.mp3', at: 0 }],
    },
    {
      d: 3.8, loc: 'lorong',
      cam: { s: 'close', on: 'ren', m: 'push' },
      cast: {
        ren: { at: [0.2, -1.4], face: 'hana', anim: 'idle', expr: 'cold' },
        hana: { at: [0.1, 0.4], face: 'ren', anim: 'floorsit', expr: 'surprised' },
      },
      caption: 'Kenapa dia menatap Hana?',
      lines: [{ who: 'ren', text: 'Kau. Berdiri.', note: 'dingin tapi tidak kasar' }],
    },
    {
      d: 4.0, loc: 'lorong',
      cam: { s: 'close', on: 'mira', m: 'orbit' },
      cast: {
        mira: { at: 'E', face: 'hana', anim: 'angry', expr: 'angry' },
        hana: { at: [0.1, 0.4], face: 'ren', anim: 'floorsit', expr: 'sad' },
      },
      lines: [{ who: 'mira', text: 'Tunggu saja besok, gadis miskin.', note: 'mendesis pelan' }],
    },
    {
      d: 3.0, beat: 'cliff', end: true, loc: 'lorong', fx: ['vignette'],
      cam: { s: 'xclose', on: 'hana', m: 'push', amt: 1.4 },
      cast: { hana: { at: [0.1, 0.4], face: 150, anim: 'floorsit', expr: 'think' } },
      caption: 'Siapa sebenarnya Ren?',
    },
  ],
};
