---

# Ergoscriptjs

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Issues][issues-img]][issues-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

## Install

```bash
npm install ergoscript
```

## Usage

### Basic transaction to send token

```ts
const tx = new Transaction([
  {
    funds: {
      ERG: 100000,
      tokens: [{ tokenId: 'token id', amount: '1' }],
    },
    toAddress: 'address',
    additionalRegisters: {},
  },
]);

const unsignedTx = (await tx.build()).toJSON();

// using ergo wallet
const signedTx = await ergo.sign_tx(unsignedTx);
await ergo.submit_tx(signedTx);
```

### Multiple recipients / airdrop 

```ts
const tokenId = '<tokenId>'
const recipients = [
  { address: '<address_1>', amount: 1 },
  { address: '<address_2>', amount: 10 },
  { address: '<address_3>', amount: 100 },
  { address: '<address_4>', amount: 1000 }
]

const tx = new Transaction(recipients.map(rec => {
  return {
    funds: {
      ERG: 100000,
      tokens: [{ tokenId, amount: rec.amount }],
    },
    toAddress: rec.address,
    additionalRegisters: {},
  }
}));

const unsignedTx = (await tx.build()).toJSON();

// using ergo wallet
const signedTx = await ergo.sign_tx(unsignedTx);
await ergo.submit_tx(signedTx);
```

### Immutability

```ts
// Methods return a new instance instead of modifying the old instance
const INPUT_0 = new eUTXOBox(tokenToRent as ExplorerBox);

// modify ergoTree value
const OUTPUT_0 = INPUT_0.sendTo(changeAddress);
OUTPUT_0.ergoTree !== INPUT_0.ergoTree;

// setRegisters - add registers and return new instance
const INPUT_0 = new eUTXOBox(tokenToRent as ExplorerBox);
const OUTPUT_0 = INPUT_0.setRegisters({
  R5: { value: price, type: Long },
  R6: { value: period, type: Long },
});

const tx = new Transaction([
  [INPUT_0, OUTPUT_0], // setting those boxes as first input and output of the transaction - handy for smart contracts
  {
    funds: {
      ERG: 100000,
      tokens: [{ tokenId: 'token id', amount: '1' }],
    },
    toAddress: 'address',
    additionalRegisters: {},
  },
]);

// reset registers - remove all registers and return new instance
const OUTPUT_0 = INPUT_0.resetRegisters();
```

### Test script with Mocha test

```ts
import buildScriptScope from 'ergoscript/lib/ergoscriptMock';

const script = `sigmaProp(true)`;

const tx = new Transaction([
  {
    funds: {
      ERG: 100000,
      tokens: [{ tokenId: 'token id', amount: '1' }],
    },
    toAddress: 'address',
    additionalRegisters: {},
  },
]);

describe('Rentring transaction', () => {
  it('reduces to true', async () => {
    const txBuilt = await tx.build();

    const simulator = await buildScriptScope(txBuilt);
    const response = simulator.execute(script);

    expect(response).to.be.true;
  });
});
```

[build-img]: https://github.com/nirvanush/ergoscript/actions/workflows/release.yml/badge.svg
[build-url]: https://github.com/nirvanush/ergoscript/actions/workflows/release.yml
[npm-img]: https://img.shields.io/npm/v/ergoscript
[npm-url]: https://www.npmjs.com/package/ergoscript
[issues-img]: https://img.shields.io/github/issues/nirvanush/ergoscript
[issues-url]: https://github.com/nirvanush/ergoscript/issues
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
