/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                // Align with web :root light tokens (globals.css)
                background: "#f4f5f8", // ~ hsl(220 16% 97%)
                foreground: "#141827", // hsl(228 30% 12%)
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#141827",
                },
                primary: {
                    DEFAULT: "#334aff", // Brand blue
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "#edeef2", // ~ hsl(220 14% 93%)
                    foreground: "#5d6476", // secondary body (web --muted-foreground)
                },
                accent: "#334aff",
                border: "#d5d8e0", // ~ hsl(220 13% 88%)
                /** @deprecated use `foreground` */
                text: "#141827",
            }
        },
    },
    plugins: [],
}
