<p align="center"><img src="https://i.postimg.cc/4NrNT4LF/shion-2.png" alt="Shion"></p>
<p align="center"><strong>Easy image optimization for your custom build process.</strong></p>
<p align="center">
  <a href="https://github.com/prettier/prettier"><img alt="styled with prettier" src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg"/></a>
  <a href="https://codeclimate.com/github/chiiya/shion/maintainability"><img src="https://api.codeclimate.com/v1/badges/63590547bf0f138bae58/maintainability" /></a>
</p>

The goal of this project is to create a simple to use, opinionated API around image-min to optimize
your image files, that can be called as a node script in your build process. See below for an example.

#### Features

- Image optimization with imagemin
- Create webp versions of images
- Resize images with sharp

### Usage

```bash
npm install --dev asebi
```

Then, import and use the library:

```javascript
const { asebi } = require('asebi');

const config = {
  webp: true,
}

(async () => {
  await asebi.resize('src/assets/images', 'dist/images', { sizes: [210, 420], pattern: '[name]_[size].[extension]' });
  await asebi.images('dist/images', 'public/images', config);
})();
```

![](https://i.imgur.com/g85Wlf0.png)
