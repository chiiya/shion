const { shion } = require('../dist');

(async () => {
  await shion.resize('images', 'dist/images', { sizes: [210, 420], pattern: '[name]_[size].[extension]' });
  await shion.images('dist/images', 'public/images');
})();

