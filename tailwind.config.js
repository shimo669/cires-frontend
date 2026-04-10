/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // This line tells Tailwind to look at your Login.tsx
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}