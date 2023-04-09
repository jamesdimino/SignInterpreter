/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  variants: {
    extend: {
        opacity: ['disabled'],
        backgroundColor: ['disabled']
      }
  },
  theme: {
    extend: {
        backgroundImage: {
            'asl': "url('./src/static/asl.png')"
          },
    },
  },
  plugins: [],
  
}
