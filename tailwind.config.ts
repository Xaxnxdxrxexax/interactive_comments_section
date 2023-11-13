import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        "Fm-Moderate-blue": "hsl(238, 40%, 52%)",
        "Fm-Soft-Red": "hsl(358, 79%, 66%)",
        "Fm-Light-grayish blue": "hsl(239, 57%, 85%)",
        "Fm-Pale-red": "hsl(357, 100%, 86%)",
        "Fm-Dark-blue": "hsl(212, 24%, 26%)",
        "Fm-Grayish-Blue": "hsl(211, 10%, 45%)",
        "Fm-Light-gray": "hsl(223, 19%, 93%)",
        "Fm-Very-light-gray": "hsl(228, 33%, 97%)",
        "Fm-White": "hsl(0, 0%, 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
