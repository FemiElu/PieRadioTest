/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#334aff", // Brand Blue
                background: "#f7f6f6", // Light Grey
                card: "#ffffff", // White
                text: "#141827", // Dark Navy
                accent: "#334aff", // Brand Blue
                muted: "#d5d5d5", // Light Border Grey
                border: "#d5d5d5",
            }
        },
    },
    plugins: [],
}
