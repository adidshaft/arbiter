/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: 'rgba(8, 15, 16, 0.88)',
        panelSoft: 'rgba(12, 22, 23, 0.75)',
        panelBorder: 'rgba(83, 255, 186, 0.16)',
        mint: '#35f1a2',
        mintSoft: '#89f8c8',
        sand: '#f5f1e8',
        ink: '#081011',
        ember: '#ff7f61'
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(53, 241, 162, 0.18), 0 20px 80px rgba(0, 0, 0, 0.45)'
      },
      backgroundImage: {
        grid: 'linear-gradient(rgba(53, 241, 162, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(53, 241, 162, 0.06) 1px, transparent 1px)',
        radial: 'radial-gradient(circle at top left, rgba(53, 241, 162, 0.13), transparent 30%), radial-gradient(circle at 80% 20%, rgba(137, 248, 200, 0.08), transparent 24%), radial-gradient(circle at bottom right, rgba(255, 127, 97, 0.08), transparent 25%)'
      },
      animation: {
        'fade-in': 'fadeIn 320ms ease-out',
        float: 'float 7s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      }
    }
  },
  plugins: []
}
