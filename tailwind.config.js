/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rd-blue': '#0066FF',
        'rd-blue-glow': '#00CCFF',
        'rd-dark': '#050505',
        'rd-card': '#0a0a0a',
        'rd-danger': '#ff3333',
        'rd-success': '#00ff88',
        'rd-warning': '#ffaa00',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'speed': 'speed 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        speed: {
          '0%': { transform: 'translateY(-100vh) translateX(0)', opacity: '0' },
          '50%': { opacity: '0.6' },
          '100%': { transform: 'translateY(100vh) translateX(100px)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}