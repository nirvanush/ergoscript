import { expect } from 'chai';
import Transaction, { SigmaType } from '../src';
import { NANO_ERG_IN_ERG } from '../src/constants';
import { utxos } from './jsons/utxos';
import { tokensFromWallet } from './jsons/loadTokensFromWallet.mock';
import * as ergoTs from '@coinbarn/ergo-ts';

function mockInstance(txInstance: Transaction): void {
  txInstance.get_utxos = async (amount: string, tokenId: string) =>
    new Promise(resolve => resolve(utxos));
  txInstance.get_change_address = async () =>
    new Promise(resolve => resolve('9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk'));
  txInstance.loadTokensFromWallet = async () => new Promise(resolve => resolve(tokensFromWallet));
  txInstance.currentHeight = async () => new Promise(resolve => resolve(760493));
}

describe('Transaction', () => {
  describe('new Transaction', () => {
    it('creates a new Tx', async () => {
      const txInstance = new Transaction([
        {
          funds: {
            ERG: 0.001 * NANO_ERG_IN_ERG,
            tokens: [
              {
                tokenId: '0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b',
                amount: 1,
              },
            ],
          },
          toAddress: '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk',
          additionalRegisters: {
            R4: { value: 4, type: SigmaType.Long },
            R5: { value: 4, type: SigmaType.Long },
            R6: {
              value: new ergoTs.Address('9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk')
                .ergoTree,
              type: SigmaType.CollByte,
            },
          },
        },
      ]);

      mockInstance(txInstance);

      const tx = (await txInstance.build()).toJSON();
      const txBuilt = await txInstance.build();
      expect(txBuilt.outputs[0].R4['Long'].get).to.equal(4);
      expect(tx.inputs.length).to.equal(1);
      expect(tx.outputs.length).to.equal(3);
    });

    it('creates transaction with multiple outputs addresses', async () => {
      const toAddress = '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk';
      const changeAddress = '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk';

      const txInstance = new Transaction([
        {
          funds: {
            ERG: 0.02 * NANO_ERG_IN_ERG,
            tokens: [],
          },
          toAddress,
          additionalRegisters: {},
        },
        {
          funds: {
            ERG: 0.001 * NANO_ERG_IN_ERG,
            tokens: [
              {
                tokenId: '0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b',
                amount: 1,
              },
            ],
          },
          toAddress,
          additionalRegisters: {},
        },
      ]);

      mockInstance(txInstance);

      const tx = (await txInstance.build()).toJSON();
      const txBuilt = await txInstance.build();

      expect(tx.outputs.length).to.equal(4);
    });
  });
});
