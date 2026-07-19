import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ministry: {
          navy: "#0b1f3a",
          blue: "#153e75",
          gold: "#c08a1a",
          pale: "#f6f8fb"
        }
      },
      boxShadow: {
        panel: "0 18px 45px rgba(11, 31, 58, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
