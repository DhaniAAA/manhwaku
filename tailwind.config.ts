import type { Config } from 'tailwindcss';

export default {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'tea-green': '#c5dac1',
                'ash-clay': '#bcd0c7',
                'ash-clay-2': '#a9b2ac',
            },
        },
    },
    plugins: [],
} satisfies Config;
