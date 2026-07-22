/** @type {import('tailwindcss').config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#2563EB',
        'brand-blue-hover': '#1D4ED8',
        'blood-red': '#DC2626',
        'blood-red-hover': '#B91C1C',
        'success': '#16A34A',
        'warning': '#F59E0B',
        'admin-bg': '#F8FAFC',
        'admin-card': '#FFFFFF',
        'admin-heading': '#1E3A8A',
        'admin-heading-secondary': '#1E293B',
        'admin-text-secondary': '#64748B',
        'donor-bg': '#FFF5F5',
        'donor-heading': '#991B1B',
        'donor-heading-dark': '#7F1D1D',
        'donor-text': '#374151',
      }
    },
  },
  plugins: [],
}