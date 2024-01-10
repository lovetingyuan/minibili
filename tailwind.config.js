/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    files: ['src/**/*.tsx'],
    extract: {
      tsx: content => {
        const regex = /s\.[i|v|t]\('([^']+)'\)/g
        const matches = content.match(regex) || []
        const strings = matches
          .map(match => match.substring(5, match.length - 2))
          .filter(s => /[a-z]/.test(s[0]))
          .map(v => v.split(' '))
          .flat()
        // strings.length && console.log(44, strings)
        return strings
      },
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
