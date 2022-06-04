---

# Ergoscriptjs

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Code Coverage][codecov-img]][codecov-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

## Install

```bash
npm install ergoscript.js
```

## Usage

### Basic transaction of send token

```ts
const txInstance = new Transaction([
  {
    funds: {
      ERG: 100000,
      tokens: [{ tokenId: 'token id', amount: '1' }],
    },
    toAddress: 'address',
    changeAddress: 'address',
    additionalRegisters: {},
  },
]);
```

[build-img]: https://github.com/nirvanush/ergoscript.js/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/nirvanush/ergoscript.js/actions/workflows/release.yml
[npm-img]: https://img.shields.io/npm/v/ergoscript.js
[npm-url]: https://www.npmjs.com/package/ergoscript.js
[issues-img]: https://img.shields.io/github/issues/nirvanush/ergoscript.js
[issues-url]: https://github.com/nirvanush/ergoscript.js/issues
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
