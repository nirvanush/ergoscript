import { expect } from 'chai';
import buildScriptScope from '../src/ergoscriptMock';
import Box, { SigmaType, ExplorerBox } from '../src/Box';
import explorerBox from './jsons/explorer-locked-box';
import { Address, minBoxValue } from '@coinbarn/ergo-ts';
import Transaction from '../src';
import { utxos } from './jsons/utxos';
import { tokensFromWallet } from './jsons/loadTokensFromWallet.mock';

const { Long, CollByte } = SigmaType;
const changeAddress = '9fEei1zvMr5CLPxpagFt4fHMyVyGJWMkowd2ezNhUyNfUZjhVPE';

let txInstance: Transaction;

const script = `
  val isDefined = OUTPUTS.size > 2
  val isRentalPeriodSame = OUTPUTS(0).R6[Long].get == INPUTS(0).R6[Long].get
  val isAmountOk = OUTPUTS(1).value == INPUTS(0).R5[Long].get
  val txSenderAddress = OUTPUTS(OUTPUTS.size - 2).propositionBytes
  val isSendingFundsToSeller = OUTPUTS(1).propositionBytes == INPUTS(0).R4['Coll[Byte]'].get
  val isSettingTheRenter = OUTPUTS(0).R7['Coll[Byte]'].isDefined && OUTPUTS(0).R7['Coll[Byte]'].get == txSenderAddress

  sigmaProp(allOf(Coll(
    isDefined,
    isRentalPeriodSame,
    isAmountOk,
    isSendingFundsToSeller,
    isSettingTheRenter
  )))
`;

const tree = new Address(changeAddress).ergoTree;
const INPUT_0 = new Box(explorerBox as ExplorerBox).setRegisters({
  R4: { value: tree, type: CollByte },
  R5: { value: 200000000, type: Long },
  R6: { value: 1000 * 60 * 60 * 24, type: Long },
});

const deltaTime = INPUT_0.R6[Long].get;
const endOfRent = new Date().getTime() + parseInt(deltaTime);
const price = INPUT_0.R5[Long].get;

const OUTPUT_0 = INPUT_0.setRegisters({
  R7: { value: tree, type: CollByte },
  R8: { value: endOfRent, type: Long },
});

describe('Renting script', () => {
  describe('When required amount has beed sent to the owner', () => {
    beforeEach(() => {
      txInstance = new Transaction([
        [INPUT_0, OUTPUT_0],
        {
          funds: {
            ERG: parseInt(price),
            tokens: [],
          },
          toAddress: Address.fromErgoTree(INPUT_0.R4[CollByte].get).address,
          changeAddress: changeAddress,
          additionalRegisters: {},
        },
      ]);

      txInstance.get_utxos = async (amount: string, tokenId: string) =>
        new Promise(resolve => resolve(utxos));
      txInstance.loadTokensFromWallet = async () =>
        new Promise(resolve => resolve(tokensFromWallet));
      txInstance.currentHeight = async () => new Promise(resolve => resolve(760493));
    });

    it('allows to modify registers', async () => {
      const txBuilt = await txInstance.build();
      expect(txBuilt.outputs[0].R5['Long'].get).to.equal(price);

      const simulator = await buildScriptScope(txBuilt);
      const response = simulator.execute(script);

      expect(response).to.be.true;
    });
  });

  describe('When renter sent less than required', () => {
    beforeEach(() => {
      txInstance = new Transaction([
        [INPUT_0, OUTPUT_0],
        {
          funds: {
            ERG: parseInt(price) - 100,
            tokens: [],
          },
          toAddress: Address.fromErgoTree(INPUT_0.R4[CollByte].get).address,
          changeAddress: changeAddress,
          additionalRegisters: {},
        },
      ]);

      txInstance.get_utxos = async (amount: string, tokenId: string) =>
        new Promise(resolve => resolve(utxos));
      txInstance.loadTokensFromWallet = async () =>
        new Promise(resolve => resolve(tokensFromWallet));
      txInstance.currentHeight = async () => new Promise(resolve => resolve(760493));
    });

    it('script reduces to false', async () => {
      const txBuilt = await txInstance.build();
      expect(txBuilt.outputs[0].R5['Long'].get).to.equal(price);
      expect(txBuilt.outputs[1].value).to.not.equal(price);
      const simulator = await buildScriptScope(txBuilt);
      const response = simulator.execute(script);

      expect(response).to.be.false;
    });
  });
});
