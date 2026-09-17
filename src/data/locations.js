// Titik posisi (mark) = [x, z] di lantai, satuan meter.
// Arah hadap (face) di naskah: 0 = menghadap +z (arah kamera default), 180 = membelakangi.
export const LOCATIONS = {
  jalan_sakura: {
    name: 'Jalan Sakura', mood: 'pagi',
    marks: { A: [0, 0], B: [1.2, -0.8], C: [-1.2, -0.6] },
  },
  genkan: {
    name: 'Loker Sepatu Seiran', mood: 'dalam',
    marks: { loker: [-1.3, -0.4], A: [0, 0.4], B: [0.9, 0.1], C: [1.5, -0.5], D: [1.6, 0.8] },
  },
  lorong: {
    name: 'Lorong Seiran', mood: 'dalam',
    marks: { A: [0, 0], B: [0, -4], C: [0.7, -1.8], D: [-0.6, 1.6], E: [0.75, 0.9], F: [0, 3] },
  },
  kelas: {
    name: 'Kelas 1-A', mood: 'dalam',
    marks: { bangku: [-1.1, 0.5], depan: [0, -2.4], mira: [1.1, -0.6], riko: [2.2, -0.6], nana: [2.2, 0.5], A: [-0.35, 0.35], B: [0.2, -1.2] },
  },
  atap: {
    name: 'Atap Seiran', mood: 'siang',
    marks: { pagar: [0, -2.1], A: [0, 0], B: [-1, 0.7], C: [1.1, 0.4], D: [-2.2, -0.9], E: [0.6, -1.2] },
  },
  gudang_luar: {
    name: 'Gudang Klub Musik (luar)', mood: 'sore',
    marks: { pintu: [0, -1.25], A: [0, 0.9], pohon: [-2.5, -0.3], B: [1.8, 1.3], C: [0.9, 2.6] },
  },
  gudang_dalam: {
    name: 'Gudang Klub Musik (dalam)', mood: 'gelap',
    marks: { piano: [0, -1.05], kursi: [0, -0.6], pintu: [0, 3.0], A: [0, 0.7], B: [-1.4, 0.2] },
  },
};

// Suasana cahaya: bg, hemi [langit, tanah, intensitas], sun [warna, intensitas, posisi]
export const MOODS = {
  pagi:  { bg: '#BFE3FF', hemi: ['#EAF5FF', '#B89A80', 1.0], sun: ['#FFFFFF', 1.3, [4, 8, 5]] },
  siang: { bg: '#9FD2FF', hemi: ['#EAF5FF', '#9A8A78', 1.0], sun: ['#FFFFFF', 1.5, [3, 9, 4]] },
  sore:  { bg: '#FFB38A', hemi: ['#FFD9B8', '#6A4A5A', 0.8], sun: ['#FF9A5A', 1.4, [-6, 3, 3]] },
  dalam: { bg: '#DCD6C8', hemi: ['#FFF7EA', '#8A7A6A', 1.1], sun: ['#FFF2DD', 0.8, [3, 6, 4]] },
  gelap: { bg: '#07080F', hemi: ['#3B4470', '#050608', 0.45], sun: ['#A9B8FF', 0.5, [-3, 5, 2]] },
  malam: { bg: '#0B1030', hemi: ['#44528A', '#101425', 0.5], sun: ['#7D8FFF', 0.5, [-5, 6, 2]] },
  hujan: { bg: '#6B7A8C', hemi: ['#B8C4D4', '#3A4250', 0.8], sun: ['#D0DAE6', 0.5, [2, 8, 3]] },
};
