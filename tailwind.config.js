/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'stacks-orange': '#FFB84D',
        'stacks-blue': '#2A5ADA',
        'stacks-dark': '#1A1A1A',
        // Fintech color palette
        'fintech-blue': '#3B82F6',
        'fintech-dark-blue': '#1E40AF',
        'fintech-light-blue': '#DBEAFE',
        'fintech-gray': '#6B7280',
        'fintech-light-gray': '#F3F4F6',
        'fintech-green': '#10B981',
        'fintech-red': '#EF4444',
      },
      boxShadow: {
        'fintech': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'fintech-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}