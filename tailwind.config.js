/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1E90FF',
          green: '#11fc82',
          navy: '#0b1c3d',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #1E90FF, #11fc82)',
      },
    },
  },
  plugins: [],
};
