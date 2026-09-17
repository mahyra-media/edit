// Olah rekaman: jadikan mono, potong hening depan/belakang, normalisasi volume, simpan sebagai WAV.
export function trimAndNormalize(buf) {
  const len = buf.length;
  const sr = buf.sampleRate;
  const mono = new Float32Array(len);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += d[i] / buf.numberOfChannels;
  }
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(mono[i]));
  const thr = Math.max(0.012, peak * 0.08);
  let s = 0;
  while (s < len && Math.abs(mono[s]) < thr) s++;
  let e = len - 1;
  while (e > s && Math.abs(mono[e]) < thr) e--;
  s = Math.max(0, s - Math.round(sr * 0.06));
  e = Math.min(len, e + Math.round(sr * 0.18));
  const gain = peak > 0 ? Math.min(6, 0.89 / peak) : 1;
  const out = new Float32Array(Math.max(0, e - s));
  const fade = Math.round(sr * 0.012);
  for (let i = 0; i < out.length; i++) {
    let v = mono[s + i] * gain;
    if (i < fade) v *= i / fade;
    if (i > out.length - fade) v *= (out.length - i) / fade;
    out[i] = v;
  }
  return { data: out, sampleRate: sr, peak };
}

export function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buffer);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export async function processAudioBlob(blob, ctx) {
  let buf;
  try {
    buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  } catch {
    throw new Error('File suara tidak bisa dibaca. Coba format MP3 atau WAV.');
  }
  const { data, sampleRate, peak } = trimAndNormalize(buf);
  if (peak < 0.01 || data.length < sampleRate * 0.2) throw new Error('Suara terlalu pelan atau kosong. Dekatkan mikrofon lalu coba lagi.');
  return { wav: encodeWAV(data, sampleRate), duration: data.length / sampleRate };
}
