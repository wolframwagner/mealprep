import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f9f4',
          100: '#e3f1e3',
          200: '#c8e2c9',
          300: '#9ccb9e',
          400: '#69ad6c',
          500: '#46934a',
          600: '#347637',
          700: '#2b5e2e',
          800: '#254b27',
          900: '#203e22',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
