/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enables dark mode via class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'admin-gradient': 'linear-gradient(to right, #5e72e4, #11cdef)',
        'employee-gradient': 'linear-gradient(to right, #f6d365, #fda085)',
        'client-gradient': 'linear-gradient(to right, #a1c4fd, #c2e9fb)',
      },
      colors: {
        primary: '#5e72e4',
        accent: '#11cdef',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulseSlow 2s infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '60%': { transform: 'scale(1.05)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      fontWeight: {
        extra: '850',
      },
      letterSpacing: {
        tighter: '-0.02em',
        widest: '0.25em',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};