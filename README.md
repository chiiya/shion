# Postmix

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Travis](https://img.shields.io/travis/alexjoverm/typescript-library-starter.svg)](https://travis-ci.org/alexjoverm/typescript-library-starter)
[![Coveralls](https://img.shields.io/coveralls/alexjoverm/typescript-library-starter.svg)](https://coveralls.io/github/alexjoverm/typescript-library-starter)

**Extending the 80% use case of Laravel Mix with additional functionality.**  
This package was developed
to complement Mix, and as such won't implement functionality already available in Mix. However, it does not depend on Mix, and can be used independently in any kind of application.

#### Features

- Image optimization with imagemin
- Create webp versions of images

### Usage

```bash
npm install --dev postmix
```

Then, import and use the library in your mix file:

```javascript
const { postmix } = require('postmix');

postmix.images('resources/assets/images', 'public/images', { webp: true });
```

![](https://i.imgur.com/g85Wlf0.png)