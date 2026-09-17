// EPISODE 2 — "Pita Biru Direbut"
export default {
  id: 'ep02',
  no: 2,
  title: 'Pita Biru Direbut',
  judulUpload: 'Pita peninggalan ibunya direbut di atap sekolah 💙 #2',
  bgm: 'audio/bgm/ep02.mp3',
  shots: [
    {
      d: 2.2, beat: 'hook', loc: 'kelas',
      cam: { s: 'xclose', on: 'hana', angle: 150, m: 'push', amt: 1.5 },
      cast: { hana: { at: 'bangku', face: 180, anim: 'sit', expr: 'neutral' } },
      hook: 'JANGAN SENTUH PITA INI!',
    },
    {
      d: 3.8, beat: 'konflik', loc: 'kelas',
      cam: { s: 'medium', on: 'sae', m: 'pan' },
      cast: {
        sae: { at: 'depan', face: 0, anim: 'talk', expr: 'smile' },
        hana: { at: 'bangku', face: 180, anim: 'sit', expr: 'shy' },
        mira: { at: 'mira', face: 180, anim: 'sit', expr: 'cold' },
      },
      lines: [{ who: 'sae', text: 'Hana Aozora, murid beasiswa baru kita.', note: 'ramah, formal' }],
    },
    {
      d: 4.0, loc: 'kelas',
      cam: { s: 'close', on: 'mira', m: 'push' },
      cast: {
        mira: { at: 'mira', face: 'hana', anim: 'sit', expr: 'smirk' },
        riko: { at: 'riko', face: 'mira', anim: 'sit', expr: 'happy' },
        hana: { at: 'bangku', face: 180, anim: 'sit', expr: 'shy' },
      },
      lines: [
        { who: 'mira', text: 'Beasiswa? Pantas bau kuah ramen.', note: 'setengah berbisik ke Riko' },
        { who: 'riko', text: 'Hahaha!' },
      ],
    },
    {
      d: 4.0, beat: 'eskalasi', loc: 'kelas',
      cam: { s: 'ots', on: 'mira', from: 'hana', m: 'push' },
      cast: {
        hana: { at: 'bangku', face: 'mira', anim: 'sit', expr: 'scared' },
        mira: { at: 'B', to: 'A', face: 'hana', anim: 'walk', expr: 'smirk', move: [0, 0.5] },
      },
      caption: 'Jam istirahat',
      lines: [{ who: 'mira', text: 'Pita jelek begini, beli di pasar?', note: 'meremehkan' }],
    },
    {
      d: 3.2, loc: 'kelas', fx: ['shake'],
      cam: { s: 'close', on: 'mira', m: 'handheld', amt: 1.3 },
      cast: {
        mira: { at: 'A', face: 'hana', anim: 'grab', expr: 'smirk' },
        hana: { at: 'bangku', face: 'mira', anim: 'sit', expr: 'surprised' },
      },
      pop: 'SRET!',
      lines: [{ who: 'hana', text: 'Kembalikan! Itu milik ibuku!', note: 'panik, keras' }],
      sfx: [{ src: 'audio/sfx/whoosh.mp3', at: 0 }],
    },
    {
      d: 3.8, loc: 'kelas',
      cam: { s: 'medium', on: 'mira', m: 'orbit' },
      cast: {
        mira: { at: 'A', face: 'hana', anim: 'holdup', expr: 'smirk' },
        hana: { at: 'bangku', face: 'mira', anim: 'sit', expr: 'scared' },
      },
      props: [{ p: 'ribbon', at: [-0.4, 1.95, 0.3] }],
      lines: [{ who: 'mira', text: 'Ibumu? Yang menghilang itu?', note: 'tertawa kecil' }],
    },
    {
      d: 3.6, loc: 'kelas', fx: ['vignette'],
      cam: { s: 'xclose', on: 'hana', m: 'push', amt: 1.3 },
      cast: { hana: { at: 'bangku', face: -60, anim: 'sit', expr: 'angry' } },
      lines: [{ who: 'hana', text: 'Ibuku tidak pernah meninggalkanku.', note: 'gemetar, marah' }],
    },
    {
      d: 4.2, loc: 'atap', fx: ['petals'],
      cam: { s: 'wide', angle: 20, m: 'pan' },
      cast: {
        mira: { at: 'A', to: 'pagar', face: 180, anim: 'run', expr: 'smirk', move: [0, 0.6] },
        hana: { at: 'B', to: 'E', face: 180, anim: 'run', expr: 'scared' },
        nana: { at: 'C', face: 'mira', anim: 'laugh', expr: 'happy' },
      },
      caption: 'Atap sekolah',
      lines: [{ who: 'nana', text: 'Lempar saja, Mira!', note: 'bersorak' }],
      sfx: [{ src: 'audio/sfx/angin.mp3', at: 0 }],
    },
    {
      d: 3.6, loc: 'atap',
      cam: { s: 'close', on: 'hana', m: 'push' },
      cast: {
        hana: { at: 'E', face: 'mira', anim: 'scared', expr: 'scared' },
        mira: { at: 'pagar', face: 'hana', anim: 'holdup', expr: 'smirk' },
      },
      lines: [{ who: 'hana', text: 'Tolong... apa pun, asal jangan itu.', note: 'memohon' }],
    },
    {
      d: 3.8, loc: 'atap',
      cam: { s: 'low', on: 'mira', m: 'orbit' },
      cast: {
        mira: { at: 'pagar', face: 'hana', anim: 'holdup', expr: 'smirk' },
        hana: { at: 'E', face: 'mira', anim: 'scared', expr: 'scared' },
      },
      props: [{ p: 'ribbon', at: [0, 1.95, -2.1] }],
      lines: [{ who: 'mira', text: 'Kalau begitu, keluar dari Seiran.', note: 'pelan, puas' }],
    },
    {
      d: 3.2, loc: 'atap', fx: ['petals', 'shake'],
      cam: { s: 'insert', point: [-0.8, 2.3, -1.6], off: [0.9, -0.3, 1.2], m: 'tilt', amt: 1.4 },
      cast: {
        mira: { at: 'pagar', face: 'hana', anim: 'surprised', expr: 'surprised' },
        hana: { at: 'E', face: 'mira', anim: 'surprised', expr: 'surprised' },
      },
      props: [{ p: 'ribbon', at: [0, 1.95, -2.1], to: [-2.1, 1.6, -0.9], spin: true }],
      pop: 'WUSSH!',
      caption: 'Angin bertiup kencang',
      sfx: [{ src: 'audio/sfx/angin-kencang.mp3', at: 0 }],
    },
    {
      d: 4.8, beat: 'twist', loc: 'atap',
      cam: { s: 'medium', on: 'kaito', m: 'push' },
      cast: {
        kaito: { at: 'D', face: 'hana', anim: 'catch', expr: 'cold' },
        hana: { at: 'E', face: 'kaito', anim: 'surprised', expr: 'surprised' },
        mira: { at: 'pagar', face: 'kaito', anim: 'idle', expr: 'surprised' },
      },
      props: [{ p: 'ribbon', at: [-2.05, 1.45, -0.75] }],
      hook: 'SIAPA DIA?',
      lines: [{ who: 'kaito', text: 'Pita ini... aku pernah melihatnya.', note: 'pelan, menerawang' }],
    },
    {
      d: 3.6, loc: 'atap',
      cam: { s: 'close', on: 'mira', m: 'push' },
      cast: {
        mira: { at: 'pagar', face: 'kaito', anim: 'scared', expr: 'scared' },
        kaito: { at: 'D', face: 'hana', anim: 'idle', expr: 'cold' },
      },
      lines: [{ who: 'mira', text: 'Kak Kaito? Kenapa Kakak di sini?', note: 'gugup, nada turun' }],
    },
    {
      d: 3.8, loc: 'atap',
      cam: { s: 'ots', on: 'kaito', from: 'hana', m: 'push' },
      cast: {
        kaito: { at: [-1.3, -0.95], face: 'hana', anim: 'give', expr: 'smile' },
        hana: { at: 'E', face: 'kaito', anim: 'idle', expr: 'surprised' },
      },
      lines: [{ who: 'kaito', text: 'Jaga baik-baik. Jangan sampai hilang lagi.', note: 'lembut, misterius' }],
    },
    {
      d: 3.0, beat: 'cliff', end: true, loc: 'atap', fx: ['vignette', 'petals'],
      cam: { s: 'xclose', on: 'hana', m: 'push', amt: 1.4 },
      cast: { hana: { at: 'E', face: -60, anim: 'idle', expr: 'think' } },
      caption: '"Lagi"...? Apa maksudnya?',
    },
  ],
};
