import { expect } from 'chai';
import Transaction, { SigmaType, TransactionJson } from '../src';
import { NANO_ERG_IN_ERG } from '../src/constants';
import * as ergoTs from '@coinbarn/ergo-ts';

import { mockInstance } from './helpers/mockInstance';
import ErgoWallet from '../src/wallet/Wallet';
import { UnsignedTx } from '../src/wallet/types/connector';

// R4 - name // R4 - royalty V
// R5 - description V
// R6 - decimal V
// R7 - content type
// R8 - SHA256 hash of picture
// R9 - cover photo

describe('Transaction', () => {
  describe('new mint transaction', () => {
    it('creates a first mint', async () => {
      const wallet = await new ErgoWallet().fromMnemonics('dial million permit enact liquid inject lion silent giggle please impose toilet swear upper sleep');
      wallet.setPublicAddress('9fz1p5StMKKzdvKH4TsfvnoSPCBbqKgk19gwirCZR9hxr4KkvR1');

      const txInstance = new Transaction([
        {
          funds: {
            ERG: 0.001 * NANO_ERG_IN_ERG,
            tokens: [
              {
                tokenId: '',
                amount: 1,
                isMint: true
              },
            ],
          },
          toAddress: '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk',
          additionalRegisters: {
            R4: { value: 'Best token ever', type: SigmaType.CollByte },
            R5: { value: 'Best token ever description', type: SigmaType.CollByte },
            R6: { value: 0, type: SigmaType.Int },
            R7: { value: '0e020101', type: SigmaType.Raw },
            R8: { value: 'somethings', type: SigmaType.CollByte },
            R9: { value: 'https://ipfs.io/ipfs/bafybeidrtmn7grzijipexukinmkmlkmpuugjwv5i2hy33gdipql27myshu', type: SigmaType.CollByte }
          },
        },
      ], { wallet });

      // mockInstance(txInstance);

      const tx = (await txInstance.build()).toJSON();
      
      try {
        const signedTx = wallet.sign_tx(tx);
        console.log(signedTx);
      } catch(e) {
        console.error(e);
      }
      // const txHash = await wallet.submit_tx(signedTx);
      // console.log(txHash);
    });

    // it('creates transaction with multiple outputs addresses', async () => {
    //   const toAddress = '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk';
    //   const changeAddress = '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk';

    //   const txInstance = new Transaction([
    //     {
    //       funds: {
    //         ERG: 0.02 * NANO_ERG_IN_ERG,
    //         tokens: [],
    //       },
    //       toAddress,
    //       additionalRegisters: {},
    //     },
    //     {
    //       funds: {
    //         ERG: 0.001 * NANO_ERG_IN_ERG,
    //         tokens: [
    //           {
    //             tokenId: '0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b',
    //             amount: 1,
    //           },
    //         ],
    //       },
    //       toAddress,
    //       additionalRegisters: {},
    //     },
    //   ]);

    //   mockInstance(txInstance);

    //   const tx = (await txInstance.build()).toJSON();
    //   const txBuilt = await txInstance.build();

    //   expect(tx.outputs.length).to.equal(4);
    // });
  });
});
