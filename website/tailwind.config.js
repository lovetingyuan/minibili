/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [require.resolve('./index.html')],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
}
