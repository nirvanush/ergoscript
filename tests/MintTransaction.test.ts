/*
import { expect } from 'chai';
import Transaction, { SigmaType, TransactionJson } from '../src';
import { NANO_ERG_IN_ERG } from '../src/constants';
import * as ergoTs from '@coinbarn/ergo-ts';

import ErgoWallet from '../src/wallet/Wallet';
import { ErgoBox } from '../src/wallet/types/connector';

// R4 - name // R4 - royalty V
// R5 - description V
// R6 - decimal V
// R7 - content type
// R8 - SHA256 hash of picture
// R9 - cover photo

type NFTParams = {
  name: string;
  description: string;
  artUrl: string;
  checkSum?: string;
  sendTo?: string;
};

class NFTCollection {
  royalties: number; // 20,30
  mintWallet: ErgoWallet;
  artType: string;
  royaltiesBox: ErgoBox | null;
  nftParams: NFTParams[];
  chain: TransactionJson[];

  constructor(args: { royalties: number; mintWallet: ErgoWallet; artType: string }) {
    this.royalties = args.royalties;
    this.mintWallet = args.mintWallet;
    this.artType = args.artType;
    this.royaltiesBox = null;
    this.nftParams = [];
    this.chain = [];
  }

  add(args: NFTParams) {
    this.nftParams.push(args);

    return this;
  }

  async mint() {
    for (const params of this.nftParams) {
      if (!this.royaltiesBox) {
        // create a mint box first
        await this._createRoyaltiesBoxTx();
        await this._createMintTx(params);
      } else {
        await this._createMintTx(params);
      }
    }
  }

  private async _createRoyaltiesBoxTx() {
    const tx = new Transaction(
      [
        {
          funds: {
            ERG: this.nftParams.length * 0.01 * NANO_ERG_IN_ERG,
            tokens: [],
          },
          toAddress: this.mintWallet.publicAddress,
          additionalRegisters: {
            R4: { value: 50, type: SigmaType.Int },
            R5: {
              value: new ergoTs.Address(this.mintWallet.publicAddress).ergoTree,
              type: SigmaType.CollByte,
            },
          },
        },
      ],
      { wallet: this.mintWallet }
    );

    const unsignedTx = await tx.build();
    const signedTx = await this.mintWallet.sign_tx(unsignedTx.toJSON());
    console.log(JSON.stringify(signedTx));
    this.royaltiesBox = signedTx.outputs[0];
    const txHash = await this.mintWallet.submit_tx(signedTx);

    console.log('royalties box submitted: ', txHash);
    console.log('royalties box submitted');
  }

  private async _createMintTx(params: NFTParams) {
    if (!this.royaltiesBox) throw new Error('No royalties box defined');

    const tx = new Transaction(
      [
        {
          funds: {
            ERG: 0.001 * NANO_ERG_IN_ERG,
            tokens: [
              {
                tokenId: this.royaltiesBox.boxId,
                amount: 1,
                isMint: true,
              },
            ],
          },
          toAddress: params.sendTo || this.mintWallet.publicAddress,
          additionalRegisters: {
            R4: { value: params.name, type: SigmaType.ByteArray },
            R5: { value: params.description, type: SigmaType.ByteArray },
            R6: { value: 0, type: SigmaType.Int },
            R7: { value: '0e020101', type: SigmaType.Raw },
            R8: { value: 'checksum', type: SigmaType.ByteArray },
            R9: { value: params.artUrl, type: SigmaType.ByteArray },
          },
        },
      ],
      { wallet: this.mintWallet, chainedInputs: [this.royaltiesBox] }
    );

    const unsignedTx = (await tx.build()).toJSON();

    const signedTx = await this.mintWallet.sign_tx(unsignedTx);
    console.log(JSON.stringify(signedTx));
    this.royaltiesBox = signedTx.outputs[1];

    try {
      const txHash = await this.mintWallet.submit_tx(signedTx);
    } catch (e) {
      console.error(e);
    }

    console.log('nft box submitted');
  }
}

describe('Transaction', () => {
  describe('new mint transaction', () => {
    it.skip('creates a first mint', async () => {
      const wallet = await new ErgoWallet().fromMnemonics('***');
      wallet.setPublicAddress('****');

      const txInstance = new Transaction(
        [
          {
            funds: {
              ERG: 0.001 * NANO_ERG_IN_ERG,
              tokens: [
                {
                  tokenId: '',
                  amount: 1,
                  isMint: true,
                },
              ],
            },
            toAddress: '****',
            additionalRegisters: {
              R4: { value: 'Best token ever', type: SigmaType.ByteArray },
              R5: { value: 'Best token ever description', type: SigmaType.ByteArray },
              R6: { value: 0, type: SigmaType.Int },
              R7: { value: '0e020101', type: SigmaType.Raw },
              R8: { value: 'somethings', type: SigmaType.ByteArray },
              R9: {
                value:
                  'https://ipfs.io/ipfs/bafybeidrtmn7grzijipexukinmkmlkmpuugjwv5i2hy33gdipql27myshu',
                type: SigmaType.ByteArray,
              },
            },
          },
        ],
        { wallet }
      );

      const tx = (await txInstance.build()).toJSON();

      try {
        const signedTx = wallet.sign_tx(tx);
        console.log(JSON.stringify(signedTx));
      } catch (e) {
        console.error(e);
      }
      // const txHash = await wallet.submit_tx(signedTx);
      // console.log(txHash);
    });

    it.skip('mint two tokens with royalties', async () => {
      const mintWallet = await new ErgoWallet().fromMnemonics('***');
      mintWallet.setPublicAddress('9fz1p5StMKKzdvKH4TsfvnoSPCBbqKgk19gwirCZR9hxr4KkvR1');

      const collection = new NFTCollection({
        royalties: 20,
        mintWallet: mintWallet,
        artType: 'image',
      });

      collection
        .add({
          name: 'Hello World #1',
          description: 'test mass mint token',
          artUrl:
            'https://ipfs.io/ipfs/bafybeidrtmn7grzijipexukinmkmlkmpuugjwv5i2hy33gdipql27myshu',
        })
        .add({
          name: 'Hello World #2',
          description: 'test mass mint token',
          artUrl:
            'https://ipfs.io/ipfs/bafybeidrtmn7grzijipexukinmkmlkmpuugjwv5i2hy33gdipql27myshu',
        });

      await collection.mint();
    });
  });
});
*/
