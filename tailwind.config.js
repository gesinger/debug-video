module.exports = {
  content: ['./src/**/*.js'],
  plugins: [],
  theme: {
    extend: {
      fontFamily: {
        display: ['IBM Plex Mono', 'Fira Mono', 'monospace'],
        body: ['IBM Plex Mono', 'Fira Mono', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        secondary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // From Darcula color theme. If updating here, update in src/colors.js
        label: {
          '-1': 'transparent',
          '0': 'hsl(191, 97%, 77%)',
          '1': 'hsl(135, 94%, 65%)',
          '2': 'hsl(31, 100%, 71%)',
          '3': 'hsl(326, 100%, 74%)',
          // purple used for tables
          // '4': 'hsl(265, 89%, 78%)',
          '4': 'hsl(0, 100%, 67%)',
          '5': 'hsl(65, 92%, 76%)',
        }
      },
    },
  },
}
