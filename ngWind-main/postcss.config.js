module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'), // Ajoutez ceci avant Tailwind CSS
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
