/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.tsx"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(20 14% 5%)",
        surface: "hsl(20 14% 8%)",
        border: "hsl(20 10% 16%)",
        muted: "hsl(20 8% 60%)",
        fg: "hsl(30 20% 96%)",
        brand: "hsl(22 90% 56%)",
        accent: "hsl(140 60% 50%)",
      },
    },
  },
  plugins: [],
};
