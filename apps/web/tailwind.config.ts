import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050608',
        panel: '#141820',
        panelSoft: '#1b2029',
        accent: '#1790ff',
        x: '#1690ff',
        o: '#ff4a55'
      },
      boxShadow: {
        card: '0 10px 30px rgba(0, 0, 0, 0.35)',
        glow: '0 0 30px rgba(23, 144, 255, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
