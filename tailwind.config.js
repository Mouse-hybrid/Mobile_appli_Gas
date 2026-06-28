/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Dòng này giúp Tailwind nhận diện code trong thư mục src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

