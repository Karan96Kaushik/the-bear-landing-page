/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'bear-pattern': "url('/src/assets/bear.jpg')",
      }
    },
  }
  ,
  plugins: [],
}
