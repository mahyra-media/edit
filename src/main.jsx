import { createRoot } from 'react-dom/client';
import App from './ui/App.jsx';
import './ui/styles.css';

// Tunggu font siap supaya teks di kanvas tidak memakai font cadangan saat direkam
const fontsReady = document.fonts
  ? Promise.race([
      Promise.all([
        document.fonts.load("400 100px 'Dela Gothic One'"),
        document.fonts.load("800 60px 'M PLUS Rounded 1c'"),
        document.fonts.load("500 30px 'M PLUS Rounded 1c'"),
      ]),
      new Promise((r) => setTimeout(r, 3000)),
    ])
  : Promise.resolve();

fontsReady.then(() => createRoot(document.getElementById('root')).render(<App />));
