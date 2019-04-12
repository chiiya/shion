const { asebi } = require('../dist');

(async () => {
  await asebi.resize('images', 'dist/images', { sizes: [210, 420], pattern: '[name]_[size].[extension]' });
  await asebi.images('dist/images', 'public/images');
})();

