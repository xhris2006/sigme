import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ministry: {
          navy: "#061b3a",
          blue: "#2463eb",
          gold: "#f4b321",
          pale: "#f5f8fd"
        }
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.07)",
        soft: "0 20px 70px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
