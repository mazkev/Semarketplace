/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        shopee: '#FF5376',
        shopeeLight: '#FFF0F3',
        shopeeHover: '#E11D48',
        neoYellow: '#FFE600',
        neoPink: '#FF5376',
        neoGreen: '#4ADE80',
        neoCyan: '#00F0FF',
        neoPurple: '#A855F7',
        neoOrange: '#FF7A00',
        neoCream: '#FFFDF6',
        neoDark: '#121212',
        neoBlack: '#000000',
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo': '4px 4px 0px 0px #000000',
        'neo-md': '6px 6px 0px 0px #000000',
        'neo-lg': '8px 8px 0px 0px #000000',
        'neo-xl': '12px 12px 0px 0px #000000',
        'neo-dark-sm': '2px 2px 0px 0px #FFFFFF',
        'neo-dark': '4px 4px 0px 0px #FFFFFF',
        'neo-dark-md': '6px 6px 0px 0px #FFFFFF',
        'neo-dark-lg': '8px 8px 0px 0px #FFFFFF',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
        '5': '5px',
      }
    },
  },
  plugins: [],
}
