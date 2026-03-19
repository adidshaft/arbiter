/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: 'rgba(8, 15, 16, 0.92)',
        panelSoft: 'rgba(12, 22, 23, 0.85)',
        panelBorder: 'rgba(83, 255, 186, 0.12)',
        mint: '#35f1a2',
        mintSoft: '#89f8c8',
        sand: '#f5f1e8',
        ink: '#081011',
        ember: '#ff7f61',
        slate: {
          950: '#040b0c'
        }
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(53, 241, 162, 0.12), 0 20px 80px rgba(0, 0, 0, 0.5)',
        'glow-mint': '0 0 20px -5px rgba(53, 241, 162, 0.3)'
      },
      backgroundImage: {
        'premium-bg': 'radial-gradient(circle at 0% 0%, rgba(53, 241, 162, 0.08) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(255, 127, 97, 0.05) 0%, transparent 40%), linear-gradient(180deg, #040b0c 0%, #081011 100%)',
        'grid-pattern': 'linear-gradient(rgba(53, 241, 162, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(53, 241, 162, 0.03) 1px, transparent 1px)'
      },
      animation: {
        'fade-in': 'fadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        float: 'float 7s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' }
        }
      }
    }
  },
  plugins: []
}
