/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [require.resolve('./index.html'), './**/*.htm'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
}
