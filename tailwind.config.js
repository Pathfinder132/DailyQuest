/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1D1535',
        electric: '#6B35F4',
        lilac: '#EFE8FF',
        lemon: '#F9F35A',
        aqua: '#38E5D1',
        sky: '#66D8FF',
        coral: '#FF656F',
        lime: '#9DEB73',
      },
      boxShadow: {
        sticker: '0 7px 0 #1D1535',
        stickerSm: '0 4px 0 #1D1535',
        glowPurple: '0 0 30px rgba(107, 53, 244, 0.20)',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        bob: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-7px)' } },
        popIn: { '0%': { transform: 'scale(.94)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        laser: { '0%': { opacity: '0', transform: 'scaleX(.2)' }, '35%': { opacity: '1' }, '100%': { opacity: '0', transform: 'scaleX(1.2)' } },
        wiggle: { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-5deg)' }, '75%': { transform: 'rotate(5deg)' } },
      },
      animation: {
        bob: 'bob 2.6s ease-in-out infinite',
        popIn: 'popIn .22s ease-out both',
        laser: 'laser .6s ease-out both',
        wiggle: 'wiggle .45s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
