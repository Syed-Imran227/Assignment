/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F5F2EA",
        sheet: "#FBF9F4",
        "sheet-subtle": "#F0EDE4",
        ink: "#15181B",
        graphite: "#5B6168",
        "graphite-light": "#8E959E",
        rule: "#D8D2C3",
        "rule-strong": "#B9B2A0",
        "rule-subtle": "#E8E4DA",
        verdigris: "#1F7A66",
        amber: "#B7791F",
        vermilion: "#D2431F",
        "slate-blue": "#3E5C86",
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["IBM Plex Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["IBM Plex Mono", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "6px",
      }
    },
  },
  plugins: [],
}
