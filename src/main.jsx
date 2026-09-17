import { Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import './ui/styles.css';

// Tampilkan error di layar (bukan halaman putih) supaya mudah dilacak
function showError(msg) {
  let box = document.getElementById('err-box');
  if (!box) {
    box = document.createElement('pre');
    box.id = 'err-box';
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:50vh;overflow:auto;margin:0;padding:16px;background:#2a0f16;color:#ffb3c0;font:13px/1.5 monospace;z-index:9999;white-space:pre-wrap';
    document.body.appendChild(box);
  }
  box.textContent += `\n⚠ ${msg}`;
}
window.addEventListener('error', (e) => showError(e.error?.stack || e.message));
window.addEventListener('unhandledrejection', (e) => showError(e.reason?.stack || String(e.reason)));

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#ffb3c0', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2>Studio error</h2>
          {String(this.state.error.stack || this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}

// Tunggu font siap supaya teks di kanvas tidak memakai font cadangan saat direkam
const fontsReady = document.fonts
  ? Promise.race([
      Promise.all([
        document.fonts.load("400 100px 'Dela Gothic One'"),
        document.fonts.load("800 60px 'M PLUS Rounded 1c'"),
        document.fonts.load("500 30px 'M PLUS Rounded 1c'"),
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ]).catch(() => {})
  : Promise.resolve();

fontsReady.then(() => createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>));
