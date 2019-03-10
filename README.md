# Asebi 🌺

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Travis](https://img.shields.io/travis/alexjoverm/typescript-library-starter.svg)](https://travis-ci.org/alexjoverm/typescript-library-starter)
[![Coveralls](https://img.shields.io/coveralls/alexjoverm/typescript-library-starter.svg)](https://coveralls.io/github/alexjoverm/typescript-library-starter)

**Easy image optimization for your custom build process.**  
The goal of this project is to create a simple to use, opinionated API around image-min to optimize
your image files. It can be called as a node script in your build process. See below for an exampl.

#### Features

- Image optimization with imagemin
- Create webp versions of images

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
  await asebi.images('src/assets/images', 'public/images', config);
})();
```

![](https://i.imgur.com/g85Wlf0.png)