// Rekam canvas komposit + audio WebAudio jadi satu file video
const TYPES = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

export function startRecording(canvas, audioStream, fps = 30) {
  if (typeof MediaRecorder === 'undefined') throw new Error('Browser tidak mendukung MediaRecorder');
  const mimeType = TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
  const tracks = [...canvas.captureStream(fps).getVideoTracks(), ...(audioStream ? audioStream.getAudioTracks() : [])];
  const rec = new MediaRecorder(new MediaStream(tracks), {
    ...(mimeType && { mimeType }),
    videoBitsPerSecond: 16_000_000,
    audioBitsPerSecond: 192_000,
  });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start(500);
  return {
    ext: /mp4/.test(mimeType) ? 'mp4' : 'webm',
    stop: () => new Promise((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || mimeType || 'video/webm' }));
      rec.stop();
    }),
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
