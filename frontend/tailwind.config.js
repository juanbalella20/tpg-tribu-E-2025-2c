/** @type {import('tailwindcss').Config} */
export default {
  safelist: [
    'bg-red-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-emerald-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
  ],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}