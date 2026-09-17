// Path aset relatif ke folder public/ (aman untuk deploy di subfolder)
export const asset = (p) => import.meta.env.BASE_URL + p;

// Vite mengembalikan index.html untuk file yang tidak ada, jadi cek content-type
export async function fetchAsset(p) {
  try {
    const res = await fetch(asset(p));
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('text/html')) return null;
    return res;
  } catch {
    return null;
  }
}
