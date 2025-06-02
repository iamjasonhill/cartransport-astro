/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E2412',
        secondary: '#2c3e50',
        accent: '#3498db',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        serif: ['Arvo', 'serif'],
      },
    },
  },
  plugins: [],
}
