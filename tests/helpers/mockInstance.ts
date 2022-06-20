import Transaction, { SigmaType } from '../../src';
import { utxos } from '../jsons/utxos';
import { tokensFromWallet } from '../jsons/loadTokensFromWallet.mock';

export function mockInstance(
  txInstance: Transaction,
  params: {
    height: number;
    changeAddress: string;
  } = {
    height: 760493,
    changeAddress: '9hu1CHr4MBd7ikUjag59AZ9VHaacvTRz34u58eoLp7ZF3d1oSXk',
  }
): void {
  txInstance.get_utxos = async (amount: string, tokenId: string) =>
    new Promise(resolve => resolve(utxos));
  txInstance.get_change_address = async () => new Promise(resolve => resolve(params.changeAddress));
  txInstance.loadTokensFromWallet = async () => new Promise(resolve => resolve(tokensFromWallet));
  txInstance.currentHeight = async () => new Promise(resolve => resolve(params.height));
}
