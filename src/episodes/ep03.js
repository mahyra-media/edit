// EPISODE 3 — "Kenta Dikira Modus"
export default {
  id: 'ep03',
  no: 3,
  title: 'Kenta Dikira Modus',
  judulUpload: 'Niatnya nolong, malah difitnah satu sekolah 😭 #3',
  bgm: 'audio/bgm/ep03.mp3',
  shots: [
    {
      d: 2.2, beat: 'hook', loc: 'lorong',
      cam: { s: 'medium', on: 'hana', m: 'pull', amt: 1.4 },
      cast: { hana: { at: 'B', to: [0, -2.4], face: 0, anim: 'carry', expr: 'neutral' } },
      props: [{ p: 'books', follow: 'hana' }],
      hook: 'NIATNYA MENOLONG, MALAH DIFITNAH',
    },
    {
      d: 3.6, beat: 'konflik', loc: 'lorong', fx: ['shake'],
      cam: { s: 'medium', on: 'riko', m: 'handheld', amt: 1.2 },
      cast: {
        hana: { at: [0, -2.4], face: 0, anim: 'surprised', expr: 'surprised' },
        riko: { at: [0.6, -0.6], to: [0.2, -1.9], face: 'hana', anim: 'walk', expr: 'smirk', move: [0, 0.35] },
      },
      props: [{ p: 'books', at: [0.1, 0.02, -2.0], scatter: true }],
      pop: 'BRAK!',
      lines: [{ who: 'riko', text: 'Aduh, maaf. Sengaja.', note: 'senyum lebar' }],
      sfx: [{ src: 'audio/sfx/buku-jatuh.mp3', at: 0.3 }],
    },
    {
      d: 3.8, loc: 'lorong',
      cam: { s: 'low', on: 'kenta', m: 'push' },
      cast: {
        kenta: { at: 'D', to: [-0.4, -0.8], face: 180, anim: 'phone', expr: 'happy' },
        hana: { at: [0, -2.4], face: 0, anim: 'pickup', expr: 'sad' },
      },
      props: [{ p: 'phone', follow: 'kenta' }],
      lines: [{ who: 'kenta', text: 'Oke, direkam. Bully jam tujuh pagi.', note: 'gaya reporter' }],
    },
    {
      d: 3.8, loc: 'lorong',
      cam: { s: 'medium', on: 'kenta', m: 'orbit' },
      cast: {
        kenta: { at: [-0.4, -1.9], face: 'hana', anim: 'pickup', expr: 'smile' },
        hana: { at: [0, -2.4], face: 'kenta', anim: 'pickup', expr: 'surprised' },
      },
      props: [{ p: 'books', at: [-0.2, 0.02, -2.1], scatter: true }],
      lines: [{ who: 'kenta', text: 'Sini, aku bantu. Aku Kenta.', note: 'ceria' }],
    },
    {
      d: 3.4, loc: 'lorong',
      cam: { s: 'close', on: 'hana', m: 'push' },
      cast: {
        hana: { at: [0, -2.4], face: 'kenta', anim: 'idle', expr: 'think' },
        kenta: { at: [-0.4, -1.9], face: 'hana', anim: 'phone', expr: 'smile' },
      },
      lines: [{ who: 'hana', text: 'Kenapa kamu merekam aku?', note: 'curiga' }],
    },
    {
      d: 3.6, loc: 'lorong',
      cam: { s: 'close', on: 'kenta', m: 'handheld' },
      cast: {
        kenta: { at: [-0.4, -1.9], face: 'hana', anim: 'surprised', expr: 'scared' },
        hana: { at: [0, -2.4], face: 'kenta', anim: 'idle', expr: 'think' },
      },
      lines: [{ who: 'kenta', text: 'Bukan kamu! Aku merekam mereka!', note: 'panik, cepat' }],
    },
    {
      d: 4.0, beat: 'eskalasi', loc: 'lorong',
      cam: { s: 'wide', angle: 180, m: 'pan' },
      cast: {
        mira: { at: 'A', face: 'kenta', anim: 'point', expr: 'smirk' },
        nana: { at: 'E', face: 'kenta', anim: 'laugh', expr: 'happy' },
        kenta: { at: [-0.4, -1.9], face: 'mira', anim: 'surprised', expr: 'surprised' },
        hana: { at: [0, -2.4], face: 'mira', anim: 'idle', expr: 'scared' },
      },
      pop: 'CIEEE~',
      caption: 'Seluruh lorong menoleh',
      lines: [{ who: 'mira', text: 'Wah, Kenta naksir anak beasiswa?', note: 'keras, supaya semua dengar' }],
    },
    {
      d: 3.4, loc: 'lorong',
      cam: { s: 'close', on: 'nana', m: 'push' },
      cast: {
        nana: { at: 'E', face: 'kenta', anim: 'crossarms', expr: 'smirk' },
        mira: { at: 'A', face: 'kenta', anim: 'crossarms', expr: 'smirk' },
      },
      lines: [{ who: 'nana', text: 'Cocok. Sama-sama nggak punya kelas.', note: 'sinis' }],
    },
    {
      d: 4.0, loc: 'lorong',
      cam: { s: 'medium', on: 'hana', m: 'pull' },
      cast: {
        hana: { at: [0, -2.4], to: 'B', face: 180, anim: 'walk', expr: 'sad', move: [0.35, 1] },
        kenta: { at: [-0.4, -1.9], face: 'hana', anim: 'idle', expr: 'sad' },
      },
      lines: [{ who: 'hana', text: 'Aku bisa sendiri. Jangan dekati aku.', note: 'menahan malu, pergi' }],
    },
    {
      d: 4.2, loc: 'lorong',
      cam: { s: 'medium', on: 'kenta', angle: 20, m: 'drift' },
      cast: { kenta: { at: [-0.4, -1.9], face: 30, anim: 'sad', expr: 'cry' } },
      caption: 'Kenta, lagi-lagi salah paham',
      lines: [{ who: 'kenta', text: 'Ditolak sebelum menyatakan. Rekor baru.', note: 'komedi, lesu' }],
      sfx: [{ src: 'audio/sfx/jangkrik.mp3', at: 0.2 }],
    },
    {
      d: 4.6, beat: 'twist', loc: 'lorong', fx: ['zoom'],
      cam: { s: 'ots', on: 'yuki', from: 'kenta', m: 'push' },
      cast: {
        kenta: { at: [-0.4, -1.9], face: 'yuki', anim: 'surprised', expr: 'surprised' },
        yuki: { at: [-0.9, -0.6], face: 'kenta', anim: 'shy', expr: 'shy' },
      },
      hook: 'SI PEMALU TAHU SESUATU',
      lines: [
        { who: 'yuki', text: 'Video itu... jangan dihapus.', note: 'sangat pelan' },
        { who: 'kenta', text: 'Kamu siapa?!', note: 'kaget' },
      ],
    },
    {
      d: 3.8, loc: 'lorong',
      cam: { s: 'close', on: 'yuki', m: 'push' },
      cast: {
        yuki: { at: [-0.9, -0.6], face: 'kenta', anim: 'shy', expr: 'think' },
        kenta: { at: [-0.4, -1.9], face: 'yuki', anim: 'idle', expr: 'surprised' },
      },
      lines: [{ who: 'yuki', text: 'Suatu hari, itu jadi bukti.', note: 'yakin, tanpa kontak mata' }],
    },
    {
      d: 3.4, loc: 'lorong', fx: ['zoom'],
      cam: { s: 'insert', point: [-0.35, 1.2, -1.65], off: [0.05, 0.25, 0.35], m: 'push', amt: 1.5 },
      cast: { kenta: { at: [-0.4, -1.9], face: 0, anim: 'phone', expr: 'think' } },
      props: [{ p: 'phone', follow: 'kenta', screen: true }],
      pop: 'ZOOM',
      caption: 'Di sudut video... ada seseorang',
    },
    {
      d: 3.6, beat: 'cliff', end: true, loc: 'lorong', fx: ['vignette'],
      cam: { s: 'close', on: 'ren', m: 'push', amt: 1.3 },
      cast: { ren: { at: 'F', face: 180, anim: 'crossarms', expr: 'cold' } },
      caption: 'Kenapa Ketua OSIS diam saja?',
    },
  ],
};
